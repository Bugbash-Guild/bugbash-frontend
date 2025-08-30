// src/app/api/hero/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const backend = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!backend) {
            return NextResponse.json({ error: 'BACKEND_URL not set' }, { status: 500 });
        }

        const cookie = req.headers.get('cookie') ?? '';

        const res = await fetch(`${backend}/api/v1/hero/stats`, {
            method: 'GET',
            headers: {
                cookie,                         // Springの認証を引き継ぐ
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
