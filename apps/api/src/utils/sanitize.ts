import sanitizeHtml, { IOptions } from 'sanitize-html';

export type FieldPolicy = 'plain' | 'richText' | 'none';

const defaultPlainOptions: IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
};

// Conservative rich text whitelist; expand as needed
const defaultRichTextOptions: IOptions = {
    allowedTags: [
        'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'h1', 'h2', 'h3', 'span', 'a'
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        span: ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
        a: (_tagName: string, attribs: Record<string, string>) => {
            // Force rel noopener noreferrer on links and restrict target
            const rel = attribs.rel ? `${attribs.rel} noopener noreferrer` : 'noopener noreferrer';
            const target = attribs.target === '_blank' ? '_blank' : undefined;
            return {
                tagName: 'a',
                attribs: {
                    ...attribs,
                    ...(target ? { target } : {}),
                    rel,
                },
            };
        },
    },
    disallowedTagsMode: 'discard',
};

export const sanitizeString = (value: string, options?: IOptions) => {
    return sanitizeHtml(value, options ?? defaultPlainOptions);
};

export const sanitizeRichText = (value: string, options?: IOptions) => {
    return sanitizeHtml(value, options ?? defaultRichTextOptions);
};

export interface SanitizePolicyMap {
    [fieldPath: string]: FieldPolicy; // e.g., 'description': 'richText'
}

// Recursively sanitize objects/arrays; policy by field name (shallow match) or exact path
export const sanitizeObject = (input: any, policy: SanitizePolicyMap = {}, path: string[] = []): any => {
    if (input == null) return input;
    if (typeof input === 'string') {
        const p = policy[path.join('.')] || policy[path[path.length - 1] || ''] || 'plain';
        if (p === 'none') return input;
        if (p === 'richText') return sanitizeRichText(input);
        return sanitizeString(input);
    }
    if (Array.isArray(input)) {
        return input.map((v, idx) => sanitizeObject(v, policy, [...path, String(idx)]));
    }
    if (typeof input === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(input)) {
            out[k] = sanitizeObject(v, policy, [...path, k]);
        }
        return out;
    }
    return input;
};

export const plainSanitize = (input: any) => sanitizeObject(input);
