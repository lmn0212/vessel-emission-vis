import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3002/api/vessels');
    if (!response.ok) {
      throw new Error('Failed to fetch vessel data');
    }
    const vessels = await response.json();
    return NextResponse.json(vessels);
  } catch (error) {
    console.error('Error fetching vessel deviations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vessel deviations' },
      { status: 500 }
    );
  }
} 