import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize Prisma with the correct database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/vessel_emissions'
    }
  }
});

interface EmissionData {
  EID: number;
  VesselID: number;
  LOGID: number;
  FromUTC: string;
  TOUTC: string;
  MET2WCO2: number;
  AET2WCO2: number;
  BOT2WCO2: number;
  VRT2WCO2: number;
  TotT2WCO2: number;
  MEW2WCO2e: number;
  AEW2WCO2e: number;
  BOW2WCO2e: number;
  VRW2WCO2e: number;
  ToTW2WCO2: number;
  MESox: number;
  AESox: number;
  BOSox: number;
  VRSox: number;
  TotSOx: number;
  MENOx: number;
  AENOx: number;
  TotNOx: number;
  MEPM10: number;
  AEPM10: number;
  TotPM10: number;
  AERCO2T2W: number;
  AERCO2eW2W: number;
  EEOICO2eW2W: number;
  CreatedAt: string;
  UpdatedAt: string;
}

async function importEmissionsData() {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'data', 'daily-log-emissions.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const emissionsData: EmissionData[] = JSON.parse(fileContent);

    console.log(`Found ${emissionsData.length} emissions records to import`);

    // Get unique vessel IDs from emissions data
    const uniqueVesselIds = Array.from(new Set(emissionsData.map(data => data.VesselID)));
    console.log(`Found ${uniqueVesselIds.length} unique vessels`);

    // Create missing vessels and store their database IDs
    const vesselIdMap = new Map<number, number>();
    for (const imoNo of uniqueVesselIds) {
      const vessel = await prisma.vessel.upsert({
        where: { imoNo },
        update: {},
        create: {
          imoNo,
          name: `Vessel ${imoNo}`, // Default name
          vesselType: 1, // Default vessel type
          dwt: 0 // Default DWT
        }
      });
      vesselIdMap.set(imoNo, vessel.id);
    }
    console.log('Created/updated all vessels');

    // Process emissions in batches of 100
    const batchSize = 100;
    for (let i = 0; i < emissionsData.length; i += batchSize) {
      const batch = emissionsData.slice(i, i + batchSize);
      
      // Create emissions records
      const emissions = await prisma.emission.createMany({
        data: batch.map(data => ({
          eid: data.EID,
          vesselId: vesselIdMap.get(data.VesselID)!, // Use the database ID
          logId: BigInt(data.LOGID),
          fromUtc: new Date(data.FromUTC),
          toUtc: new Date(data.TOUTC),
          met2wco2: data.MET2WCO2,
          aet2wco2: data.AET2WCO2,
          met2wch4: 0, // These fields are not in the source data
          aet2wch4: 0,
          met2wn2o: 0,
          aet2wn2o: 0,
          met2wco2e: data.MEW2WCO2e,
          aet2wco2e: data.AEW2WCO2e,
          met2wch4e: 0,
          aet2wch4e: 0,
          met2wn2oe: 0,
          aet2wn2oe: 0,
          met2wco2ew: data.MEW2WCO2e,
          aet2wco2ew: data.AEW2WCO2e,
          met2wch4ew: 0,
          aet2wch4ew: 0,
          met2wn2oew: 0,
          aet2wn2oew: 0,
          met2wco2ew2w: data.MEW2WCO2e,
          aet2wco2ew2w: data.AEW2WCO2e,
          met2wch4ew2w: 0,
          aet2wch4ew2w: 0,
          met2wn2oew2w: 0,
          aet2wn2oew2w: 0,
          eeoico2ew2w: data.EEOICO2eW2W
        })),
        skipDuplicates: true
      });

      console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(emissionsData.length / batchSize)}`);
    }

    console.log('Import completed successfully');
  } catch (error) {
    console.error('Error importing emissions data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importEmissionsData(); 