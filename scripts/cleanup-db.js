const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING DATABASE CLEANUP ---');

    try {
        // 1. Delete dependent data first
        console.log('Deleting reports...');
        await prisma.report.deleteMany();

        console.log('Deleting notifications...');
        await prisma.notification.deleteMany();

        console.log('Deleting activity logs...');
        await prisma.activityLog.deleteMany();

        console.log('Deleting messages...');
        await prisma.message.deleteMany();

        console.log('Deleting deletion requests...');
        await prisma.deletionRequest.deleteMany();

        console.log('Deleting comments...');
        await prisma.comment.deleteMany();

        console.log('Deleting content items...');
        await prisma.contentItem.deleteMany();

        console.log('Deleting action plans...');
        await prisma.actionPlan.deleteMany();

        console.log('Deleting services...');
        await prisma.service.deleteMany();

        // 2. Clear Clients (must be done before users if there are FKs, though onDelete: Cascade might handle it)
        console.log('Deleting clients...');
        await prisma.client.deleteMany();

        // 3. Clear non-admin users
        console.log('Deleting non-admin users...');
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });
        console.log(`Deleted ${deletedUsers.count} non-admin users.`);

        console.log('--- CLEANUP COMPLETE ---');
        console.log('The following admin users were preserved:');
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        admins.forEach(admin => console.log(`- ${admin.email} (${admin.firstName})`));

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
