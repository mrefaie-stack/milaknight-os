import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
    const url = process.env.milaknight_DATABASE_URL || process.env.DATABASE_URL;

    return new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    } as any).$extends(withAccelerate())
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
