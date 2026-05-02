import { NextRequest } from 'next/server';
import { proxyGet, proxyPut } from '@/app/api/_proxy';

export async function GET(req: NextRequest) {
    return proxyGet(req, '/api/v1/hero/partner');
}

export async function PUT(req: NextRequest) {
    return proxyPut(req, '/api/v1/hero/partner');
}
