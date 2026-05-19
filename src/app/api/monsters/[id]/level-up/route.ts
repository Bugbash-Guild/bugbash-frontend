import type { NextRequest } from 'next/server';

import { proxyPost } from '@/app/api/_proxy';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    const { id } = await params;
    return proxyPost(req, `/api/monsters/${id}/level-up`);
}
