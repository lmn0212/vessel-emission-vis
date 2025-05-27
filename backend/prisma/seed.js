"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const vessels_json_1 = __importDefault(require("./vessels.json"));
const emissions_json_1 = __importDefault(require("./emissions.json"));
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.emission.deleteMany();
    await prisma.vessel.deleteMany();
    for (const vessel of vessels_json_1.default) {
        await prisma.vessel.create({
            data: {
                name: vessel.name,
                imoNo: vessel.imoNo,
                vesselType: vessel.vesselType,
                dwt: vessel.dwt,
            },
        });
    }
    for (const emission of emissions_json_1.default) {
        const vessel = await prisma.vessel.findUnique({
            where: { imoNo: emission.imoNo },
        });
        if (vessel) {
            await prisma.emission.create({
                data: {
                    eid: emission.eid,
                    vesselId: vessel.id,
                    logId: BigInt(emission.logId),
                    fromUtc: new Date(emission.fromUtc),
                    toUtc: new Date(emission.toUtc),
                    met2wco2: emission.met2wco2,
                    aet2wco2: emission.aet2wco2,
                    met2wch4: emission.met2wch4,
                    aet2wch4: emission.aet2wch4,
                    met2wn2o: emission.met2wn2o,
                    aet2wn2o: emission.aet2wn2o,
                    met2wco2e: emission.met2wco2e,
                    aet2wco2e: emission.aet2wco2e,
                    met2wch4e: emission.met2wch4e,
                    aet2wch4e: emission.aet2wch4e,
                    met2wn2oe: emission.met2wn2oe,
                    aet2wn2oe: emission.aet2wn2oe,
                    met2wco2ew: emission.met2wco2ew,
                    aet2wco2ew: emission.aet2wco2ew,
                    met2wch4ew: emission.met2wch4ew,
                    aet2wch4ew: emission.aet2wch4ew,
                    met2wn2oew: emission.met2wn2oew,
                    aet2wn2oew: emission.aet2wn2oew,
                    met2wco2ew2w: emission.met2wco2ew2w,
                    aet2wco2ew2w: emission.aet2wco2ew2w,
                    met2wch4ew2w: emission.met2wch4ew2w,
                    aet2wch4ew2w: emission.aet2wch4ew2w,
                    met2wn2oew2w: emission.met2wn2oew2w,
                    aet2wn2oew2w: emission.aet2wn2oew2w,
                    eeoico2ew2w: emission.eeoico2ew2w,
                },
            });
        }
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
//# sourceMappingURL=seed.js.map