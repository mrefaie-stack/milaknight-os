import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@milaknight.com' },
        update: {},
        create: {
            email: 'admin@milaknight.com',
            password,
            role: 'ADMIN',
            firstName: 'Admin',
            lastName: 'User',
        },
    })

    const am = await prisma.user.upsert({
        where: { email: 'am@milaknight.com' },
        update: {},
        create: {
            email: 'am@milaknight.com',
            password,
            role: 'AM',
            firstName: 'Account',
            lastName: 'Manager',
        },
    })

    const clientUser = await prisma.user.upsert({
        where: { email: 'client@milaknight.com' },
        update: {},
        create: {
            email: 'client@milaknight.com',
            password,
            role: 'CLIENT',
            firstName: 'Client',
            lastName: 'One',
        },
    })

    // Create a client profile
    await prisma.client.upsert({
        where: { id: 'client-1' },
        update: {},
        create: {
            id: 'client-1',
            name: 'Client One LLC',
            amId: am.id,
            userId: clientUser.id,
        },
    })

    console.log({ admin, am, clientUser })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
