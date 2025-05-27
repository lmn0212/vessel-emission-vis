import dynamic from 'next/dynamic';

// Dynamically import the chart component with no SSR
const VesselDeviationChart = dynamic(
  () => import('../src/components/VesselDeviationChart'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Vessel Emissions Visualization
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <VesselDeviationChart />
        </div>
      </main>
    </div>
  );
}
