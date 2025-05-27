import Decimal from 'decimal.js';

export interface PPSSCPreferenceLine {
  RowID: number;
  Category: string;
  VesselTypeID: number;
  Size: string;
  Traj: string;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
}

export interface PPBaselines {
  min: number;
  striving: number;
  yxLow: number;
  yxUp: number;
}

const yxLowF = 0.33;
const yxUpF = 1.67;

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
};

export const calculatePPSCCBaselines = ({
  factors,
  year,
  DWT,
  vesselTypeId,
}: {
  factors: PPSSCPreferenceLine[];
  year: number;
  DWT: number;
  vesselTypeId: number;
}): PPBaselines => {
  const vesselFactors = factors.filter(factor => factor.VesselTypeID === vesselTypeId);
  
  const { minFactors, strFactors } = vesselFactors.reduce<{
    minFactors: PPSSCPreferenceLine;
    strFactors: PPSSCPreferenceLine;
  }>(
    (acc, cur) => {
      const key = (() => {
        switch (cur.Traj?.trim()) {
          case 'MIN':
            return 'minFactors';
          case 'STR':
            return 'strFactors';
          default:
            return null;
        }
      })();

      if (!key) {
        return acc;
      }

      return {
        ...acc,
        [key]: cur,
      };
    },
    { minFactors: emptyFactor, strFactors: emptyFactor },
  );

  const min = calculatePPSCCBaseline({ factors: minFactors, year, DWT });
  const striving = calculatePPSCCBaseline({ factors: strFactors, year, DWT });
  const yxLow = min.mul(yxLowF);
  const yxUp = min.mul(yxUpF);

  return {
    min: min.toNumber(),
    striving: striving.toNumber(),
    yxLow: yxLow.toNumber(),
    yxUp: yxUp.toNumber(),
  };
};

export const calculatePPSCCBaseline = ({
  factors,
  year,
  DWT,
}: {
  factors: PPSSCPreferenceLine;
  year: number;
  DWT: number;
}): typeof Decimal.prototype => {
  const yearDecimal = new Decimal(year);
  const dwtDecimal = new Decimal(DWT);
  
  const year3 = yearDecimal.pow(3);
  const year2 = yearDecimal.pow(2);
  
  const sum = new Decimal(factors.a ?? 0).mul(year3)
    .plus(new Decimal(factors.b ?? 0).mul(year2))
    .plus(new Decimal(factors.c ?? 0).mul(yearDecimal))
    .plus(factors.d ?? 0);
    
  return sum.mul(dwtDecimal.pow(factors.e ?? 0));
}; 