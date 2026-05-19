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

    try {
        const res = await fetch(`${backend}${backendPath}${req.nextUrl.search}`, {
            method,
            headers: createProxyHeaders(req, body !== undefined),
            body,
            cache: 'no-store',
            redirect: 'manual',
        });

        return createProxyResponse(res);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to proxy';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function proxyPut(req: NextRequest, backendPath: string): Promise<Response> {
    return proxyRequest(req, backendPath, 'PUT', await req.text());
}

export async function proxyPost(req: NextRequest, backendPath: string): Promise<Response> {
    return proxyRequest(req, backendPath, 'POST');
}

export async function proxyPostWithBody(req: NextRequest, backendPath: string): Promise<Response> {
    return proxyRequest(req, backendPath, 'POST', await req.text());
}

export async function proxyGet(req: NextRequest, backendPath: string): Promise<Response> {
    return proxyRequest(req, backendPath, 'GET');
}
