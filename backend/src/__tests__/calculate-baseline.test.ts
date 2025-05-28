import { calculateBaseline } from '../utils/calculate-baseline.util';

describe('calculateBaseline', () => {
  it('should calculate baseline for bulk carrier', () => {
    const vesselType = 1001; // Bulk Carrier
    const dwt = 100000;
    const date = new Date('2024-01-01');
    
    const baseline = calculateBaseline(vesselType, dwt, date);
    
    expect(baseline).toBeGreaterThan(0);
    expect(typeof baseline).toBe('number');
  });

  it('should calculate baseline for tanker', () => {
    const vesselType = 1002; // Tanker
    const dwt = 80000;
    const date = new Date('2024-01-01');
    
    const baseline = calculateBaseline(vesselType, dwt, date);
    
    expect(baseline).toBeGreaterThan(0);
    expect(typeof baseline).toBe('number');
  });

  it('should handle invalid vessel type', () => {
    const vesselType = 9999; // Invalid type
    const dwt = 100000;
    const date = new Date('2024-01-01');
    
    const baseline = calculateBaseline(vesselType, dwt, date);
    
    expect(baseline).toBe(0);
  });
}); 