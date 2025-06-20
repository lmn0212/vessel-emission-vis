export interface VesselData {
  id: number;
  name: string;
  imoNo: number;
  dwt: number;
  vesselType: number;
  emissions: Emission[];
  emissionsData: Array<{
    id: number;
    vesselId: number;
    fromUtc: string | null;
    toUtc: string;
    eeoico2ew2w: number;
    met2wco2ew2w: number;
    aet2wco2ew2w: number;
    baseline: {
      min: number;
      striving: number;
      yxLow: number;
      yxUp: number;
    };
    targetEmission: number;
    deviation: number;
  }>;
}

export interface VesselDeviation {
  name: string;
  data: number[];
  dates: number[];
  minTargetEmissions: number[];
  strTargetEmissions: number[];
  minDeviations: (number | null)[];
  strDeviations: (number | null)[];
  dwt: number;
  vesselTypeId: number;
}

export interface Emission {
  id: number;
  vesselId: number;
  fromUtc: string | null;
  toUtc: string;
  eeoico2ew2w: number;
  met2wco2ew2w: number;
  aet2wco2ew2w: number;
} 

export interface Factor {
  RowID: number;
  Category: string;
  VesselTypeID: number;
  Size: "DWT";
  Traj: "MIN";
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
}