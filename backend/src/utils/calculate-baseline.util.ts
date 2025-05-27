import Decimal from 'decimal.js';
import { calculatePPSCCBaselines } from './calculate-pp-scc-baselines.util';
import ppFactors from '../data/pp-reference.json';

export const calculateBaseline = (
  _vesselType: number,
  dwt: number,
  date: Date
): number => {
  const year = date.getFullYear();
  const baselines = calculatePPSCCBaselines({
    factors: ppFactors,
    year,
    DWT: new Decimal(dwt)
  });

  return baselines.min.toNumber();
}; 