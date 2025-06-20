'use client';

import { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { VesselDeviation, Factor } from '../types/vessel';
import Decimal from 'decimal.js';
import ppReferenceData from '../../../data/pp-reference.json';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const calculatePPSCCBaseline = ({
    factors,
    year,
    DWT,
}: {
    factors: Factor;
    year: number;
    DWT: number;
}): Decimal => {
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

const calculatePPSCCBaselines = ({
    factors,
    year,
    DWT,
    vesselTypeId,
}: {
    factors: any[];
    year: number;
    DWT: number;
    vesselTypeId: number;
}) => {
    const vesselFactors = factors.filter(factor => factor.VesselTypeID === vesselTypeId);

    const { minFactors, strFactors } = vesselFactors.reduce<{
        minFactors: any;
        strFactors: any;
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
        { minFactors: null, strFactors: null },
    );

    if (!minFactors || !strFactors) {
        return {
            min: 0,
            striving: 0,
            yxLow: 0,
            yxUp: 0
        };
    }

    const min = calculatePPSCCBaseline({ factors: minFactors, year, DWT });
    const striving = calculatePPSCCBaseline({ factors: strFactors, year, DWT });
    const yxLow = min.mul(0.33);
    const yxUp = min.mul(1.67);

    return {
        min: min.toNumber(),
        striving: striving.toNumber(),
        yxLow: yxLow.toNumber(),
        yxUp: yxUp.toNumber(),
    };
};

const VesselDeviationChart = () => {
    const [data, setData] = useState<VesselDeviation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/vessels`);
                if (!response.ok) {
                    throw new Error('Failed to fetch vessel deviations');
                }
                const vessels = await response.json();

                const transformedData = vessels.map((vessel: any) => {
                    // Sort emissions by date to get the latest ones
                    const sortedEmissions = [...(vessel.emissions || [])].sort((a, b) =>
                        new Date(b.toUtc).getTime() - new Date(a.toUtc).getTime()
                    );

                    // Group emissions by quarter
                    const quarterlyEmissions = sortedEmissions.reduce((acc: { [key: string]: any[] }, emission) => {
                        const date = new Date(emission.toUtc);
                        const year = date.getFullYear();
                        const quarter = Math.floor(date.getMonth() / 3) + 1;
                        const key = `${year}-Q${quarter}`;

                        if (!acc[key]) {
                            acc[key] = [];
                        }
                        acc[key].push(emission);
                        return acc;
                    }, {});

                    // Get the last emission of each quarter
                    const quarterlyLastEmissions = Object.entries(quarterlyEmissions).map(([, emissions]) => {
                        const lastEmission = emissions.reduce((latest, current) =>
                            new Date(current.toUtc) > new Date(latest.toUtc) ? current : latest
                        );
                        return lastEmission;
                    });

                    // Sort by date
                    quarterlyLastEmissions.sort((a, b) =>
                        new Date(b.toUtc).getTime() - new Date(a.toUtc).getTime()
                    );

                    // Format data for Highcharts
                    const dates = quarterlyLastEmissions.map(emission => new Date(emission.toUtc).getTime());
                    const actualEmissions = quarterlyLastEmissions.map(emission => emission.eeoico2ew2w);
                    const minTargetEmissions = quarterlyLastEmissions.map(emission => {
                        const year = new Date(emission.toUtc).getFullYear();
                        const minFactors = ppReferenceData.find(f => f.Traj === 'MIN' && f.VesselTypeID === vessel.vesselType);
                        if (!minFactors) {
                            return 0;
                        }
                        const baselines = calculatePPSCCBaselines({
                            factors: ppReferenceData,
                            year,
                            DWT: vessel.dwt,
                            vesselTypeId: vessel.vesselType
                        });
                        return baselines.min;
                    });
                    const strTargetEmissions = quarterlyLastEmissions.map(emission => {
                        const year = new Date(emission.toUtc).getFullYear();
                        const strFactors = ppReferenceData.find(f => f.Traj === 'STR' && f.VesselTypeID === vessel.vesselType);
                        if (!strFactors) {
                            return 0;
                        }
                        const baselines = calculatePPSCCBaselines({
                            factors: ppReferenceData,
                            year,
                            DWT: vessel.dwt,
                            vesselTypeId: vessel.vesselType
                        });
                        return baselines.striving;
                    });

                    // Calculate baseline parameters for each quarter
                    const baselines = quarterlyLastEmissions.map(emission => {
                        const year = new Date(emission.toUtc).getFullYear();
                        const baseline = calculatePPSCCBaselines({
                            factors: ppReferenceData,
                            year,
                            DWT: vessel.dwt,
                            vesselTypeId: vessel.vesselType
                        });

                        return {
                            min: baseline.min,
                            striving: baseline.striving,
                            yxLow: baseline.yxLow,
                            yxUp: baseline.yxUp
                        };
                    });

                    const minDeviations = quarterlyLastEmissions.map((emission, index) => {
                        const actual = actualEmissions[index];
                        const target = minTargetEmissions[index];
                        const baseline = baselines[index];
                        const deviation = target > 0 ? ((actual - target) / target) * 100 : null;
                        return deviation;
                    });
                    const strDeviations = quarterlyLastEmissions.map((emission, index) => {
                        const actual = actualEmissions[index];
                        const target = strTargetEmissions[index];
                        const baseline = baselines[index];
                        const deviation = target > 0 ? ((actual - target) / target) * 100 : null;
                        return deviation;
                    });

                    return {
                        name: vessel.name,
                        data: actualEmissions,
                        dates,
                        minTargetEmissions,
                        strTargetEmissions,
                        minDeviations,
                        strDeviations,
                        dwt: vessel.dwt,
                        vesselType: vessel.vesselType
                    };
                });

                setData(transformedData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartOptions: Highcharts.Options = {
        chart: {
            type: 'column',
            height: 400
        },
        title: {
            text: 'Vessel Emissions Deviations'
        },
        xAxis: {
            type: 'category',
            title: {
                text: 'Vessel'
            }
        },
        yAxis: {
            title: {
                text: 'Deviation (%)',
                style: {
                    color: '#90ed7d'
                }
            },
            labels: {
                style: {
                    color: '#90ed7d'
                }
            }
        },
        tooltip: {
            formatter: function (this: Highcharts.TooltipFormatterContextObject) {
                const point = this.point;
                if (!point) return '';

                const vesselData = data.find(v => v.name === point.name);
                if (!vesselData) return '';

                const latestDate = new Date(vesselData.dates[0]).toLocaleDateString();
                const minDeviation = vesselData.minDeviations[0];
                const strDeviation = vesselData.strDeviations[0];
                const actualEmission = vesselData.data[0];
                const minTarget = vesselData.minTargetEmissions[0];
                const strTarget = vesselData.strTargetEmissions[0];

                return `
                    <b>${point.name}</b><br/>
                    Latest Date: ${latestDate}<br/>
                    DWT: ${vesselData.dwt.toLocaleString()} tonnes<br/>
                    Actual Emission: ${actualEmission?.toFixed(2)} gCO₂/tonne-mile<br/>
                    MIN Target: ${minTarget?.toFixed(2)} gCO₂/tonne-mile<br/>
                    STR Target: ${strTarget?.toFixed(2)} gCO₂/tonne-mile<br/>
                    MIN Deviation: ${minDeviation?.toFixed(2)}%<br/>
                    STR Deviation: ${strDeviation?.toFixed(2)}%
                `;
            }
        },
        plotOptions: {
            column: {
                grouping: true,
                groupPadding: 0.1,
                pointPadding: 0.05,
                dataLabels: {
                    enabled: true,
                    format: '{point.y:.2f}%'
                }
            }
        },
        series: [
            {
                type: 'column' as const,
                name: 'MIN Deviation',
                data: data.map(vessel => ({
                    name: vessel.name,
                    y: vessel.minDeviations[0] || 0,
                    color: (vessel.minDeviations[0] ?? 0) > 0 ? '#ff4444' : '#44ff44'
                }))
            },
            {
                type: 'column' as const,
                name: 'STR Deviation',
                data: data.map(vessel => ({
                    name: vessel.name,
                    y: vessel.strDeviations[0] || 0,
                    color: (vessel.strDeviations[0] ?? 0) > 0 ? '#ff8888' : '#88ff88'
                }))
            }
        ]
    };

    if (loading) {
        return <div className="text-center py-8">Loading chart data...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="w-full">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
    );
};

export default VesselDeviationChart; 