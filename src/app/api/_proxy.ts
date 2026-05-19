import { NextRequest, NextResponse } from 'next/server';

import { createProxyResponse } from './_proxyCore';

type ProxyMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

const getBackendOrigin = (): string | null =>
    process.env.BACKEND_ORIGIN ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null;

const createProxyHeaders = (req: NextRequest, hasBody: boolean): HeadersInit => ({
    cookie: req.headers.get('cookie') ?? '',
    accept: 'application/json',
    ...(hasBody && { 'content-type': 'application/json' }),
});

export async function proxyRequest(
    req: NextRequest,
    backendPath: string,
    method: ProxyMethod,
    body?: string,
): Promise<Response> {
    const backend = getBackendOrigin();
    if (!backend) {
        return NextResponse.json(
            { error: 'BACKEND_ORIGIN or NEXT_PUBLIC_API_BASE_URL not set' },
            { status: 500 },
        );
    }
    const forwardedBody = body === '' ? undefined : body;

    try {
        const res = await fetch(`${backend}${backendPath}${req.nextUrl.search}`, {
            method,
            headers: createProxyHeaders(req, forwardedBody !== undefined),
            body: forwardedBody,
            cache: 'no-store',
            redirect: 'manual',
        });

        return createProxyResponse(res);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to proxy';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
