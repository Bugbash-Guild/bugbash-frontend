// src/app/api/auth/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const backend = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!backend) {
            return NextResponse.json({ error: 'BACKEND_URL not set' }, { status: 500 });
        }

        const cookie = req.headers.get('cookie') ?? '';

        const res = await fetch(`${backend}/api/auth/status`, {
            method: 'GET',
            headers: {
                cookie,                         // Springセッションをそのまま転送
                accept: 'application/json',
            },
            cache: 'no-store',
        });

        const bodyText = await res.text();
        return new NextResponse(bodyText, {
            status: res.status,
            headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Failed to proxy' }, { status: 500 });
    }
}
