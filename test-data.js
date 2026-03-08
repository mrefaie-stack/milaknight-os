const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const requests = await prisma.serviceRequest.findMany({
        include: {
            globalService: true,
            client: {
                include: {
                    accountManager: true
                }
            }
        }
    });

    console.log(`Found ${requests.length} requests.`);
    for (const r of requests) {
        console.log(`[Request ${r.id}] status: ${r.status}`);
        console.log(`  - client attached: ${!!r.client}`);
        console.log(`  - client name: ${r.client?.name}`);
        console.log(`  - globalService attached: ${!!r.globalService}`);
        console.log(`  - globalService nameAr: ${r.globalService?.nameAr}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
