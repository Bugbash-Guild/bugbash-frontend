import { NextRequest } from 'next/server';
import { proxyPostWithBody } from '@/app/api/_proxy';

export async function POST(req: NextRequest) {
    return proxyPostWithBody(req, '/api/shop/purchase');
}
