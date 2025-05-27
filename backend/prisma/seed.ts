import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    // Read JSON files
    const vesselsPath = path.join(process.cwd(), 'data', 'vessels.json');
    const emissionsPath = path.join(process.cwd(), 'data', 'daily-log-emissions.json');

    console.log('Reading vessels from:', vesselsPath);
    console.log('Reading emissions from:', emissionsPath);

    if (!fs.existsSync(vesselsPath) || !fs.existsSync(emissionsPath)) {
      throw new Error(`Data files not found. Please ensure vessels.json and daily-log-emissions.json exist in the data directory.`);
    }

    const vesselsData = JSON.parse(fs.readFileSync(vesselsPath, 'utf-8'));
    const emissionsData = JSON.parse(fs.readFileSync(emissionsPath, 'utf-8'));

    console.log(`Found ${vesselsData.length} vessels and ${emissionsData.length} emissions records`);

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.emission.deleteMany();
    await prisma.vessel.deleteMany();

    console.log('Seeding vessels...');
    // Create vessels
    for (const vessel of vesselsData) {
      console.log('Creating vessel:', vessel.Name);
      await prisma.vessel.create({
        data: {
          name: vessel.Name,
          imoNo: vessel.IMONo,
          vesselType: vessel.VesselType,
          dwt: 180000, // Default DWT value since it's not in the JSON
        },
      });
    }

    console.log('Seeding emissions...');
    // Create emissions
    for (const emission of emissionsData) {
      const vessel = await prisma.vessel.findUnique({
        where: { imoNo: emission.VesselID },
      });

      if (vessel) {
        console.log(`Creating emission for vessel ${vessel.name} (${emission.EID})`);
        await prisma.emission.create({
          data: {
            eid: emission.EID,
            vesselId: vessel.id,
            logId: BigInt(emission.LOGID),
            fromUtc: new Date(emission.FromUTC),
            toUtc: new Date(emission.TOUTC),
            met2wco2: emission.MET2WCO2,
            aet2wco2: emission.AET2WCO2,
            met2wch4: 0, // These fields are not in the JSON
            aet2wch4: 0,
            met2wn2o: 0,
            aet2wn2o: 0,
            met2wco2e: emission.MEW2WCO2e,
            aet2wco2e: emission.AEW2WCO2e,
            met2wch4e: 0,
            aet2wch4e: 0,
            met2wn2oe: 0,
            aet2wn2oe: 0,
            met2wco2ew: emission.MET2WCO2,
            aet2wco2ew: emission.AET2WCO2,
            met2wch4ew: 0,
            aet2wch4ew: 0,
            met2wn2oew: 0,
            aet2wn2oew: 0,
            met2wco2ew2w: emission.MET2WCO2,
            aet2wco2ew2w: emission.AET2WCO2,
            met2wch4ew2w: 0,
            aet2wch4ew2w: 0,
            met2wn2oew2w: 0,
            aet2wn2oew2w: 0,
            eeoico2ew2w: emission.EEOICO2eW2W,
          },
        });
      } else {
        console.log(`Vessel not found for emission ${emission.EID} (VesselID: ${emission.VesselID})`);
      }
    }

    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 