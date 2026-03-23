import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LinkedInAPI } from '@/lib/linkedin-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'LINKEDIN', isActive: true }
    });
    if (!connection) return NextResponse.json({ pages: [] });

    try {
        const li = new LinkedInAPI(connection.accessToken);
        const orgs = await li.getOrganizations();
        const pages = (orgs.elements || []).map((el: any) => {
            const org = el['organization~'] || {};
            // Extract numeric org ID from URN like "urn:li:organization:12345"
            const urnId = el.organization || '';
            const numericId = urnId.replace('urn:li:organization:', '');
            return {
                id: numericId,
                name: org.localizedName || org.name || `Page ${numericId}`,
                urn: urnId
            };
        }).filter((p: any) => p.id);

        return NextResponse.json({ pages });
    } catch (e: any) {
        console.error('LinkedIn pages fetch failed:', e.message);
        return NextResponse.json({ pages: [], error: e.message });
    }
}
