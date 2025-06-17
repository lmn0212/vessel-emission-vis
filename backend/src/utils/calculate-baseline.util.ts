import { Decimal } from 'decimal.js';
import { calculatePPSCCBaselines } from './calculate-pp-scc-baselines.util';
import ppFactors from '../data/pp-reference.json';

export function calculateBaseline(vesselType: number, dwt: number, date: Date): number {
  // Check if vessel type exists in PP factors
  const hasValidVesselType = ppFactors.some(factor => 
    factor.Category === 'PP' && 
    factor.VesselTypeID === vesselType
  );

  if (!hasValidVesselType) {
    return 0;
  }

  const year = date.getFullYear();
  const baselines = calculatePPSCCBaselines({
    factors: ppFactors,
    year,
    DWT: new Decimal(dwt)
  });

  return baselines.min.toNumber();
} 