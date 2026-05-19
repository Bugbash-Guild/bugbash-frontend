import type { NextRequest } from 'next/server';
import { proxyPost } from '@/app/api/_proxy';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> },
): Promise<Response> {
    const { itemId } = await params;
    return proxyPost(req, `/api/inventory/${itemId}/use`);
}
