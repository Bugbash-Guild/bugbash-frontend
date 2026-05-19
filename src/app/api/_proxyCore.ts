const JSON_CONTENT_TYPE = 'application/json';

const getSetCookieHeaders = (headers: Headers): string[] => {
    const headersWithGetSetCookie = headers as Headers & {
        getSetCookie?: () => string[];
    };
    const setCookieHeaders = headersWithGetSetCookie.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) return setCookieHeaders;

    const setCookie = headers.get('set-cookie');
    return setCookie ? [setCookie] : [];
};

const isLoginRedirect = (response: Response): boolean => {
    if (response.status < 300 || response.status >= 400) return false;

    const location = response.headers.get('location');
    if (!location) return false;

    try {
        return new URL(location, 'https://app.bugbashguild.com').pathname === '/login';
    } catch {
        return false;
    }
};

const createResponseHeaders = (response: Response): Headers => {
    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const location = response.headers.get('location');
    if (location) headers.set('location', location);

    for (const setCookie of getSetCookieHeaders(response.headers)) {
        headers.append('set-cookie', setCookie);
    }

    return headers;
};

export const createProxyResponse = async (response: Response): Promise<Response> => {
    if (isLoginRedirect(response)) {
        const headers = createResponseHeaders(response);
        headers.set('content-type', JSON_CONTENT_TYPE);

        return Response.json(
            { authenticated: false },
            {
                status: 401,
                headers,
            },
        );
    }

    const bodyText = await response.text();
    const headers = createResponseHeaders(response);
    if (!headers.has('content-type')) headers.set('content-type', JSON_CONTENT_TYPE);

    return new Response(bodyText, {
        status: response.status,
        headers,
    });
};
