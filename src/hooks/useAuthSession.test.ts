import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { clearSessionHint, hasSessionHint, setSessionHint } from './useAuthSession.ts';

type CookieJar = { cookie: string };

/**
 * document.cookie の最小スタブ。代入は「1 本足す or 消す」だけ扱う
 * （このモジュールがやっているのもそれだけ）。
 */
function stubDocument(initialCookie = ''): void {
    const jar: Record<string, string> = {};
    for (const entry of initialCookie.split(';')) {
        const [name, ...rest] = entry.trim().split('=');
        if (name) jar[name] = rest.join('=');
    }

    const target: CookieJar = {
        get cookie(): string {
            return Object.entries(jar)
                .map(([name, value]) => `${name}=${value}`)
                .join('; ');
        },
        set cookie(next: string) {
            const [pair, ...attrs] = next.split(';');
            const [name, ...rest] = pair.trim().split('=');
            const expired = attrs.some((a) => /max-age\s*=\s*0/i.test(a));
            if (expired) delete jar[name];
            else jar[name] = rest.join('=');
        },
    };

    (globalThis as { document?: unknown }).document = target;
    (globalThis as { window?: unknown }).window = { location: { protocol: 'http:' } };
}

afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
});

describe('session hint', () => {
    it('reports no hint when the cookie is absent', () => {
        stubDocument('');
        assert.equal(hasSessionHint(), false);
    });

    it('reports a hint once set', () => {
        stubDocument('');
        setSessionHint();
        assert.equal(hasSessionHint(), true);
    });

    it('drops the hint when cleared, so a dead session stops ungating the render', () => {
        stubDocument('bb.authed=1');
        assert.equal(hasSessionHint(), true);

        clearSessionHint();

        assert.equal(hasSessionHint(), false);
    });

    it('ignores an unrelated cookie whose name merely shares a prefix', () => {
        stubDocument('bb.authedSomethingElse=1');
        assert.equal(hasSessionHint(), false);
    });

    it('ignores a hint cookie that is not exactly "1"', () => {
        stubDocument('bb.authed=0');
        assert.equal(hasSessionHint(), false);
    });

    it('finds the hint when other cookies come first', () => {
        stubDocument('JSESSIONID=abc; bb.authed=1; other=2');
        assert.equal(hasSessionHint(), true);
    });

    it('treats a server render (no document) as no hint', () => {
        assert.equal(hasSessionHint(), false);
    });
});
