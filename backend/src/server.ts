import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { calculateDeviation } from './utils/calculate-deviation.util';
import { calculateBaseline } from './utils/calculate-baseline.util';
import fs from 'fs';
import path from 'path';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// Load PP reference factors
let ppFactors: [];
try {
  const ppReferencePath = path.join(process.cwd(), 'data', 'pp-reference.json');
  const ppReferenceContent = fs.readFileSync(ppReferencePath, 'utf-8');
  ppFactors = JSON.parse(ppReferenceContent);
  console.log(`Loaded ${ppFactors.length} PP reference factors`);
} catch (error) {
  console.error('Error loading PP reference factors:', error);
  ppFactors = [];
}

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3003', 'http://127.0.0.1:3003'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.use(express.json());

// Helper function to convert BigInt to string in JSON
function convertBigIntToString<T>(obj: T): T extends bigint ? string : T  {
  if (obj === null || obj === undefined) {
    return obj as T extends bigint ? string : T;
  }
  if (typeof obj === 'bigint') {
    return obj.toString() as T extends bigint ? string : T;
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString) as T extends bigint ? string : T ;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBigIntToString(obj[key]);
      }
    }
    return result as T extends bigint ? string : T ;
  }
  return obj as T extends bigint ? string : T ;
}

interface Emission {
  id: number;
  toUtc: string | Date;
  eeoico2ew2w: number;
  met2wco2ew2w: number;
  aet2wco2ew2w: number;
}

// Get all vessels with their deviations
app.get('/api/vessels', async (_req: Request, res: Response) => {
  try {
    const vessels = await prisma.vessel.findMany({
      include: {
        emissions: true
      }
    });

    console.log('Found vessels:', vessels.length);
    if (vessels.length > 0) {
      console.log('First vessel sample:', JSON.stringify(convertBigIntToString(vessels[0]), null, 2));
    }

    const vesselsWithDeviations = vessels.map((vessel) => {
      try {
        if (!vessel.emissions || vessel.emissions.length === 0) {
          console.log(`No emissions data for vessel ${vessel.id}`);
          return {
            ...vessel,
            deviation: 0,
            emissionsData: []
          };
        }

        // Convert dates to ISO strings and ensure all values are properly serialized
        const emissionsWithBaselines = vessel.emissions.map((emission) => {
          const toUtc = new Date(emission.toUtc).toISOString();
          const baseline = calculateBaseline(
            vessel.vesselType,
            vessel.dwt,
            new Date(emission.toUtc)
          );
          const targetEmission = baseline * emission.eeoico2ew2w;
          const deviation = targetEmission > 0 ? ((emission.eeoico2ew2w - targetEmission) / targetEmission) * 100 : null;

          return {
            ...emission,
            toUtc,
            baseline: Number(baseline),
            targetEmission: Number(targetEmission),
            deviation: deviation !== null ? Number(deviation) : null
          };
        });

        // Sort by date
        emissionsWithBaselines.sort((a, b) =>
          new Date(b.toUtc).getTime() - new Date(a.toUtc).getTime()
        );

        const result = {
          ...vessel,
          emissions: emissionsWithBaselines.map((e: { 
            id: number;
            toUtc: string;
            eeoico2ew2w: number;
            met2wco2ew2w: number;
            aet2wco2ew2w: number;
            baseline: number;
            targetEmission: number;
            deviation: number | null;
          }) => ({
            id: Number(e.id),
            toUtc: e.toUtc,
            eeoico2ew2w: Number(e.eeoico2ew2w),
            met2wco2ew2w: Number(e.met2wco2ew2w),
            aet2wco2ew2w: Number(e.aet2wco2ew2w),
            baseline: Number(e.baseline),
            targetEmission: Number(e.targetEmission),
            deviation: e.deviation !== null ? Number(e.deviation) : null
          }))
        };

        console.log(`Processed vessel ${vessel.id} with ${emissionsWithBaselines.length} emissions`);
        return result;
      } catch (error) {
        console.error('Error calculating deviation for vessel:', vessel.id, error);
        return {
          ...vessel,
          deviation: 0,
          emissionsData: vessel.emissions.map((emission) => ({
            ...emission,
            fromUtc: emission.fromUtc ? new Date(emission.fromUtc).toISOString() : null,
            toUtc: emission.toUtc ? new Date(emission.toUtc).toISOString() : null,
            baseline: {
              min: 0,
              striving: 0,
              yxLow: 1.023,
              yxUp: 5.177
            }
          }))
        };
      }
    });

    const response = convertBigIntToString(vesselsWithDeviations);
    console.log('Sending response with', response.length, 'vessels');
    if (response.length > 0) {
      console.log('First vessel in response:', JSON.stringify(response[0], null, 2));
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    res.status(500).json({ error: 'Failed to fetch vessels', details: error.message });
  }
});

// Get a specific vessel by IMO
app.get('/api/vessels/:imo', async (req: Request, res: Response) => {
  try {
    const { imo } = req.params;
    const vessel = await prisma.vessel.findUnique({
      where: { imoNo: parseInt(imo) },
      include: {
        emissions: true
      }
    });

    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    const deviation = calculateDeviation(vessel.emissions as Emission[], {
      dwt: vessel.dwt,
      vesselType: vessel.vesselType
    }, ppFactors);
    return res.json(convertBigIntToString({ ...vessel, deviation }));
  } catch (error) {
    console.error('Error fetching vessel:', error);
    return res.status(500).json({ error: 'Failed to fetch vessel', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});