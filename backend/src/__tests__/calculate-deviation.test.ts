import { calculateDeviation } from '../utils/calculate-deviation.util';

describe('calculateDeviation', () => {
  const mockEmissions = [
    {
      id: 1,
      toUtc: '2024-01-01T00:00:00.000Z',
      eeoico2ew2w: 10,
      met2wco2ew2w: 8,
      aet2wco2ew2w: 2
    },
    {
      id: 2,
      toUtc: '2024-02-01T00:00:00.000Z',
      eeoico2ew2w: 12,
      met2wco2ew2w: 10,
      aet2wco2ew2w: 2
    }
  ];

  const mockVessel = {
    dwt: 100000,
    vesselType: 1001 // Bulk Carrier
  };

  const mockPPFactors = [
    {
      RowID: 1,
      Category: 'PP',
      VesselTypeID: 1001,
      Size: 'DWT',
      Traj: 'MIN',
      a: 0.19759542325,
      b: -1204.32747178827,
      c: 2446554.0444015,
      d: -1656558770.18489,
      e: -0.621795966623
    },
    {
      RowID: 4,
      Category: 'PP',
      VesselTypeID: 1001,
      Size: 'DWT',
      Traj: 'STR',
      a: 0.171970561295,
      b: -1046.38418984716,
      c: 2122087.93600504,
      d: -1434398489.01475,
      e: -0.621795966623
    }
  ];

  it('should calculate deviation for valid emissions data', () => {
    const deviation = calculateDeviation(mockEmissions, mockVessel, mockPPFactors);
    
    expect(deviation).toBeDefined();
    expect(typeof deviation).toBe('number');
    expect(deviation).toBeGreaterThan(0);
  });

  it('should handle empty emissions array', () => {
    const deviation = calculateDeviation([], mockVessel, mockPPFactors);
    
    expect(deviation).toBe(0);
  });

  it('should handle missing PP factors', () => {
    const deviation = calculateDeviation(mockEmissions, mockVessel, []);
    
    expect(deviation).toBe(0);
  });
}); 