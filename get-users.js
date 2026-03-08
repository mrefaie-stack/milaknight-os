const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    console.log('Admins:', users.map(u => u.email));
    const clients = await prisma.user.findMany({ where: { role: 'CLIENT' } });
    console.log('Clients:', clients.map(c => c.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
