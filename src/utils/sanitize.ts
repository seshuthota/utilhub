import DOMPurify, { type Config, type DOMPurify as DOMPurifyInstance } from 'dompurify';

// HTML sanitizer for markup we inject with dangerouslySetInnerHTML (e.g. the
// markdown preview). Tool input can arrive through shareable links, so this is
// a real XSS boundary: anything that runs here can read localStorage.
//
// DOMPurify needs a DOM. Without one it returns its input unchanged, so on the
// server we return an empty string instead and let the client fill it in.

const HTML_CONFIG: Config = {
    // HTML only: drops inline <svg>/<math>, which carry their own URL/animation
    // attack surface (xlink:href, <animate to="javascript:...">).
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    FORBID_TAGS: [
        'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
        'form', 'button', 'select', 'option', 'textarea',
        'base', 'link', 'meta', 'noscript', 'template',
    ],
    FORBID_ATTR: ['style', 'srcdoc', 'action', 'formaction', 'xlink:href', 'ping'],
    ALLOW_DATA_ATTR: false,
};

let purifier: DOMPurifyInstance | null = null;

function getPurifier(): DOMPurifyInstance | null {
    if (typeof window === 'undefined') return null;
    if (purifier) return purifier;

    // Own instance so our hooks don't leak into other DOMPurify users.
    const instance = DOMPurify(window);
    if (!instance.isSupported) return null;

    instance.addHook('afterSanitizeAttributes', (node) => {
        if (node.nodeType !== 1) return;
        const el = node as Element;
        if (!el.hasAttribute('target')) return;
        if (el.getAttribute('target') === '_blank') {
            el.setAttribute('rel', 'noopener noreferrer');
        } else {
            el.removeAttribute('target');
        }
    });

    purifier = instance;
    return purifier;
}

export function sanitizeHtml(html: string): string {
    if (!html) return '';
    const instance = getPurifier();
    if (!instance) return '';
    return instance.sanitize(html, { ...HTML_CONFIG, RETURN_TRUSTED_TYPE: false }) as string;
}
