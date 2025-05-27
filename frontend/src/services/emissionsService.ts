import type { VesselData } from '../types/vessel'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export async function fetchVessels(): Promise<VesselData[]> {
  try {
    console.log('Fetching vessels from:', `${API_BASE_URL}/api/vessels`);
    const response = await fetch(`${API_BASE_URL}/api/vessels`, {
      method: 'GET',
      headers: defaultHeaders,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch vessels:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch vessels: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received vessels data:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchVessels:', error);
    throw error;
  }
}

export async function fetchVesselByIMO(imo: string): Promise<VesselData> {
  try {
    console.log('Fetching vessel by IMO:', imo);
    const response = await fetch(`${API_BASE_URL}/api/vessels/${imo}`, {
      method: 'GET',
      headers: defaultHeaders,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch vessel:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch vessel: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received vessel data:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchVesselByIMO:', error);
    throw error;
  }
} 