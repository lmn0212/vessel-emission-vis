import { Emission, Vessel } from '@prisma/client';
import { PPSSCPreferenceLine } from './pp-baselines';
import { calculatePPSCCBaselines } from './pp-baselines';

export function calculateDeviation(
  emissions: Emission[],
  vessel: Pick<Vessel, 'dwt' | 'vesselType'>,
  ppFactors: PPSSCPreferenceLine[]
): number {
  // Filter out emissions with null or undefined values
  const validEmissions = emissions.filter(emission => 
    emission.eeoico2ew2w !== null && 
    emission.eeoico2ew2w !== undefined
  );

  if (validEmissions.length === 0) {
    return 0;
  }

  // Group emissions by quarter
  const quarterlyEmissions = validEmissions.reduce((acc: { [key: string]: Emission[] }, emission) => {
    const date = new Date(emission.toUtc);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const key = `${year}-Q${quarter}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(emission);
    return acc;
  }, {});

  // Get the last emission of each quarter
  const quarterlyLastEmissions = Object.entries(quarterlyEmissions).map(([quarter, emissions]) => {
    const lastEmission = emissions.reduce((latest, current) => 
      new Date(current.toUtc) > new Date(latest.toUtc) ? current : latest
    );
    console.log(`Quarter ${quarter} last emission:`, {
      date: lastEmission.toUtc,
      value: lastEmission.eeoico2ew2w
    });
    return lastEmission;
  });

  // Sort by date
  quarterlyLastEmissions.sort((a, b) => 
    new Date(b.toUtc).getTime() - new Date(a.toUtc).getTime()
  );

  // Get the most recent quarterly emission
  const latestQuarterlyEmission = quarterlyLastEmissions[0];
  if (!latestQuarterlyEmission) {
    return 0;
  }

  // Calculate baseline for the latest quarter
  const baselines = calculatePPSCCBaselines({
    factors: ppFactors,
    year: new Date(latestQuarterlyEmission.toUtc).getFullYear(),
    DWT: vessel.dwt,
    vesselTypeId: vessel.vesselType
  });

  console.log('Latest quarterly emission details:', {
    date: latestQuarterlyEmission.toUtc,
    value: latestQuarterlyEmission.eeoico2ew2w,
    baselines,
    vesselDwt: vessel.dwt,
    vesselType: vessel.vesselType
  });

  // Calculate deviation from minimum baseline
  const deviation = ((latestQuarterlyEmission.eeoico2ew2w - baselines.min) / baselines.min) * 100;

  console.log('Deviation calculation:', {
    latestValue: latestQuarterlyEmission.eeoico2ew2w,
    baselineMin: baselines.min,
    deviation
  });

  return deviation;
} 