import { NextRequest, NextResponse } from 'next/server';

export async function proxyGet(req: NextRequest, backendPath: string): Promise<NextResponse> {
    const backend = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backend) {
        return NextResponse.json({ error: 'BACKEND_URL not set' }, { status: 500 });
    }

    try {
        const res = await fetch(`${backend}${backendPath}`, {
            method: 'GET',
            headers: {
                cookie: req.headers.get('cookie') ?? '',
                accept: 'application/json',
            },
            cache: 'no-store',
        });

        const bodyText = await res.text();
        return new NextResponse(bodyText, {
            status: res.status,
            headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to proxy';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
