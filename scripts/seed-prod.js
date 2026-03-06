const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING PRODUCTION SEEDING ---');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@milaknight.com' },
        update: {},
        create: {
            email: 'admin@milaknight.com',
            password: hashedPassword,
            role: 'ADMIN',
            firstName: 'MilaKnight',
            lastName: 'Admin',
        },
    });

    console.log('Production Admin Created:', admin.email);
    console.log('--- SEEDING COMPLETE ---');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Error during seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
