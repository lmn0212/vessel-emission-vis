import { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/vessel_emissions'
    }
  }
})

type PPSSCPreferenceLine = {
  RowID: number
  Category: string
  VesselTypeID: number
  Size: string
  Traj: string
  a: number
  b: number
  c: number
  d: number
  e: number
}

type CalculateBaselineArgs = {
  factors: PPSSCPreferenceLine
  year: number
  DWT: Decimal
}

type CalculatePPBaselinesArgs = {
  factors: PPSSCPreferenceLine[]
  year: number
  DWT: Decimal
  vesselTypeId: number
}

type PPBaselines = {
  min: Decimal
  striving: Decimal
  yxLow: Decimal
  yxUp: Decimal
}

interface DeviationResult {
  vesselId: number
  imoNo: number
  date: Date
  actualEmission: Decimal
  baselineEmission: Decimal
  deviationPercentage: Decimal
  vesselTypeId: number
}

const yxLowF = 0.33
const yxUpF = 1.67

const emptyFactor: PPSSCPreferenceLine = {
  RowID: 0,
  Category: '',
  VesselTypeID: 0,
  Size: '',
  Traj: '',
  a: 0,
  b: 0,
  c: 0,
  d: 0,
  e: 0,
}

function calculatePPSCCBaseline({ factors, year, DWT }: CalculateBaselineArgs): Decimal {
  const a = new Decimal(factors.a)
  const b = new Decimal(factors.b)
  const c = new Decimal(factors.c)
  const d = new Decimal(factors.d)
  const e = new Decimal(factors.e)
  const yearDec = new Decimal(year)
  const yearCubed = yearDec.pow(3)
  const yearSquared = yearDec.pow(2)

  return a.mul(yearCubed)
    .plus(b.mul(yearSquared))
    .plus(c.mul(yearDec))
    .plus(d)
    .mul(DWT.pow(e))
}

function calculatePPSCCBaselines({ factors, year, DWT, vesselTypeId }: CalculatePPBaselinesArgs): PPBaselines {
  const vesselFactors = factors.filter((f: PPSSCPreferenceLine) => f.VesselTypeID === vesselTypeId)
  const { minFactors, strFactors } = vesselFactors.reduce<{
    minFactors: PPSSCPreferenceLine
    strFactors: PPSSCPreferenceLine
  }>(
    (acc, cur) => {
      const key = cur.Traj.trim() === 'MIN' ? 'minFactors' : 
                 cur.Traj.trim() === 'STR' ? 'strFactors' : null
      if (!key) {
        return acc
      }
      return {
        ...acc,
        [key]: cur,
      }
    },
    { minFactors: emptyFactor, strFactors: emptyFactor },
  )
  const min = calculatePPSCCBaseline({ factors: minFactors, year, DWT })
  const striving = calculatePPSCCBaseline({ factors: strFactors, year, DWT })
  const yxLow = min.mul(yxLowF)
  const yxUp = min.mul(yxUpF)
  return {
    min,
    striving,
    yxLow,
    yxUp,
  }
}

async function calculateDeviations(): Promise<void> {
  try {
    // Get all vessels
    const vessels = await prisma.vessel.findMany()
    console.log(`Found ${vessels.length} vessels`)

    // Get PP reference factors from the JSON file
    const ppReferencePath = path.join(process.cwd(), 'data', 'pp-reference.json')
    let ppFactors: PPSSCPreferenceLine[]
    try {
      const ppReferenceContent = fs.readFileSync(ppReferencePath, 'utf-8')
      ppFactors = JSON.parse(ppReferenceContent) as PPSSCPreferenceLine[]
    } catch (error) {
      console.error('Error reading or parsing PP reference file:', error)
      throw new Error('Failed to load PP reference factors')
    }
    console.log(`Found ${ppFactors.length} PP reference factors`)
    const results: DeviationResult[] = []
    for (const vessel of vessels) {
      console.log(`Processing vessel ${vessel.imoNo}...`)
      // Get emissions for the last day of each quarter
      const emissions = await prisma.emission.findMany({
        where: {
          vesselId: vessel.id,
          toUtc: {
            in: [
              new Date('2023-03-31'),
              new Date('2023-06-30'),
              new Date('2023-09-30'),
              new Date('2023-12-31'),
            ],
          },
        },
        orderBy: {
          toUtc: 'asc',
        },
      })
      if (emissions.length === 0) {
        console.log(`No emissions data found for vessel ${vessel.imoNo}`)
        continue
      }
      for (const emission of emissions) {
        const year = emission.toUtc.getFullYear()
        const dwt = new Decimal(vessel.dwt)
        // Calculate baseline
        const baselines = calculatePPSCCBaselines({
          factors: ppFactors,
          year,
          DWT: dwt,
          vesselTypeId: vessel.vesselType,
        })
        // Calculate actual emission (using met2wco2e as it's the most relevant metric)
        const actualEmission = new Decimal(emission.met2wco2e)
        const baselineEmission = baselines.min
        // Calculate deviation percentage
        const deviationPercentage = actualEmission
          .minus(baselineEmission)
          .div(baselineEmission)
          .mul(100)
        results.push({
          vesselId: vessel.id,
          imoNo: vessel.imoNo,
          date: emission.toUtc,
          actualEmission,
          baselineEmission,
          deviationPercentage,
          vesselTypeId: vessel.vesselType,
        })
      }
    }
    // Print results
    console.log('\nDeviation Results:')
    console.log('=================')
    for (const result of results) {
      console.log(
        `\nVessel IMO: ${result.imoNo}`,
        `\nDate: ${result.date.toISOString().split('T')[0]}`,
        `\nVessel Type: ${result.vesselTypeId}`,
        `\nActual Emission: ${result.actualEmission.toFixed(2)}`,
        `\nBaseline Emission: ${result.baselineEmission.toFixed(2)}`,
        `\nDeviation: ${result.deviationPercentage.toFixed(2)}%`,
        '\n-------------------'
      )
    }
    // Save results to a JSON file
    const outputPath = path.join(process.cwd(), 'data', 'deviation-results.json')
    fs.writeFileSync(
      outputPath,
      JSON.stringify(results.map(r => ({
        ...r,
        actualEmission: r.actualEmission.toString(),
        baselineEmission: r.baselineEmission.toString(),
        deviationPercentage: r.deviationPercentage.toString(),
      })), null, 2)
    )
    console.log(`\nResults saved to ${outputPath}`)
  } catch (error) {
    console.error('Error calculating deviations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

calculateDeviations() 