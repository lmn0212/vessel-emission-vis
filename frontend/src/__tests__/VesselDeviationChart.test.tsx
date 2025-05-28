import { render, screen, waitFor } from '@testing-library/react';
import VesselDeviationChart from '../components/VesselDeviationChart';

// Mock the fetch function
global.fetch = jest.fn();

describe('VesselDeviationChart', () => {
    const mockVessels = [
        {
            id: 1,
            name: 'BW KOBE',
            vesselType: 1001,
            dwt: 100000,
            emissions: [
                {
                    id: 1,
                    toUtc: '2024-01-01T00:00:00.000Z',
                    eeoico2ew2w: 10,
                    met2wco2ew2w: 8,
                    aet2wco2ew2w: 2
                }
            ]
        }
    ];

    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it('should render loading state initially', () => {
        render(<VesselDeviationChart />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render chart when data is loaded', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockVessels
        });

        render(<VesselDeviationChart />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Check if Highcharts container is rendered
        expect(document.querySelector('.highcharts-container')).toBeInTheDocument();
    });

    it('should handle API error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

        render(<VesselDeviationChart />);

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
}); 