// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Highcharts
jest.mock('highcharts-react-official', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="highcharts-container" className="highcharts-container" />,
  };
}); 