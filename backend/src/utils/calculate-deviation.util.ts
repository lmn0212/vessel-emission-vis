import Decimal from 'decimal.js';
import { calculatePPSCCBaselines } from './calculate-pp-scc-baselines.util';

type Emission = {
  toUtc: string | Date;
  eeoico2ew2w: number;
};

type VesselInfo = {
  dwt: number;
  vesselType: number;
};

export const calculateDeviation = (
  emissions: Emission[],
  vesselInfo: VesselInfo,
  factors: any[]
): number => {
  if (emissions.length === 0) return 0;

  const lastEmission = emissions[0];
  const year = new Date(lastEmission.toUtc).getFullYear();
  
  const baselines = calculatePPSCCBaselines({
    factors,
    year,
    DWT: new Decimal(vesselInfo.dwt)
  });

  const actualEmission = new Decimal(lastEmission.eeoico2ew2w);
  const targetEmission = baselines.min;

  if (targetEmission.isZero()) return 0;

  return actualEmission.minus(targetEmission).div(targetEmission).mul(100).toNumber();
}; 