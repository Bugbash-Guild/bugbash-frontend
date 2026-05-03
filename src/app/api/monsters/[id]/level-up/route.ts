import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    const { id } = await params;
    const backend = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backend) {
        return NextResponse.json({ error: 'BACKEND_URL not set' }, { status: 500 });
    }
    try {
        const res = await fetch(`${backend}/api/v1/monsters/${id}/level-up`, {
            method: 'POST',
            headers: {
                cookie: req.headers.get('cookie') ?? '',
                'content-type': 'application/json',
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
