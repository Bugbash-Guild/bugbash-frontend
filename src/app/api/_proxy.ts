import { NextRequest, NextResponse } from 'next/server';

import { createProxyResponse } from './_proxyCore';

type ProxyMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

const getBackendOrigin = (): string | null =>
    process.env.BACKEND_ORIGIN ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null;

/**
 * 運用トークンのヘッダ名。
 *
 * 転送するヘッダは明示的に列挙する。丸ごと素通しすると、ブラウザが
 * 付ける Authorization や独自ヘッダまでバックエンドに流れてしまう。
 */
const ADMIN_TOKEN_HEADER = 'x-bugbash-admin-token';

const createProxyHeaders = (req: NextRequest, hasBody: boolean): HeadersInit => {
    const adminToken = req.headers.get(ADMIN_TOKEN_HEADER);
    return {
        cookie: req.headers.get('cookie') ?? '',
        accept: 'application/json',
        ...(hasBody && { 'content-type': 'application/json' }),
        // 運用画面が入力したトークン。サーバ側に環境変数として持たせると、
        // 認証の無いページから誰でも集計を引けてしまう。
        ...(adminToken && { 'X-BugBash-Admin-Token': adminToken }),
    };
};

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
