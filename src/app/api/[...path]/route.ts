import type { NextRequest } from 'next/server';

import { proxyRequest } from '@/app/api/_proxy';
import { resolveBackendPath } from '@/app/api/_proxyPath';

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

const getBackendPath = async ({ params }: RouteContext): Promise<string> => {
    const { path } = await params;
    return resolveBackendPath(path);
};

export async function GET(req: NextRequest, context: RouteContext): Promise<Response> {
    return proxyRequest(req, await getBackendPath(context), 'GET');
}

export async function POST(req: NextRequest, context: RouteContext): Promise<Response> {
    return proxyRequest(req, await getBackendPath(context), 'POST', await req.text());
}

export async function PUT(req: NextRequest, context: RouteContext): Promise<Response> {
    return proxyRequest(req, await getBackendPath(context), 'PUT', await req.text());
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<Response> {
    return proxyRequest(req, await getBackendPath(context), 'PATCH', await req.text());
}

export async function DELETE(req: NextRequest, context: RouteContext): Promise<Response> {
    return proxyRequest(req, await getBackendPath(context), 'DELETE');
}
