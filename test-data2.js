const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const globalServices = await prisma.globalService.findMany();
    console.log(`Found ${globalServices.length} global services.`);
    for (const s of globalServices) {
        console.log(`[Service ${s.id}] nameEn: ${s.nameEn}, nameAr: ${s.nameAr}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
