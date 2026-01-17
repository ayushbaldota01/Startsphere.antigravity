/**
 * HTML Sanitizer Utility
 * Prevents XSS attacks by sanitizing HTML content before rendering
 */

// Allowed HTML tags for rich text content
const ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img'
]);

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
    'a': new Set(['href', 'title', 'target', 'rel']),
    'img': new Set(['src', 'alt', 'title', 'width', 'height']),
    '*': new Set(['class', 'id', 'style'])
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /<style\b[^>]*>[\s\S]*?<\/style>/gi,
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    /<object\b[^>]*>[\s\S]*?<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*['"]?\s*javascript:/gi,
];

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    let sanitized = html;

    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Parse and rebuild the HTML using DOMParser for more robust sanitization
    if (typeof window !== 'undefined' && window.DOMParser) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
            const container = doc.body.firstChild as Element;

            // Recursively sanitize all elements
            sanitizeElement(container);

            sanitized = container.innerHTML;
        } catch {
            // Fallback to basic regex sanitization if DOMParser fails
            sanitized = basicSanitize(sanitized);
        }
    } else {
        sanitized = basicSanitize(sanitized);
    }

    return sanitized;
}

function sanitizeElement(element: Element): void {
    const childrenToRemove: Element[] = [];

    for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        const tagName = child.tagName.toLowerCase();

        // Remove disallowed tags entirely
        if (!ALLOWED_TAGS.has(tagName)) {
            childrenToRemove.push(child);
            continue;
        }

        // Sanitize attributes
        const attrsToRemove: string[] = [];
        for (let j = 0; j < child.attributes.length; j++) {
            const attr = child.attributes[j];
            const attrName = attr.name.toLowerCase();

            // Check if attribute is allowed
            const tagAttrs = ALLOWED_ATTRS[tagName] || new Set();
            const globalAttrs = ALLOWED_ATTRS['*'] || new Set();

            if (!tagAttrs.has(attrName) && !globalAttrs.has(attrName)) {
                attrsToRemove.push(attr.name);
                continue;
            }

            // Check attribute value for dangerous content
            const attrValue = attr.value.toLowerCase();
            if (
                attrValue.includes('javascript:') ||
                attrValue.includes('vbscript:') ||
                attrValue.includes('data:') ||
                /on\w+\s*=/.test(attrValue)
            ) {
                attrsToRemove.push(attr.name);
            }
        }

        // Remove dangerous attributes
        for (const attrName of attrsToRemove) {
            child.removeAttribute(attrName);
        }

        // Force safe link attributes
        if (tagName === 'a') {
            child.setAttribute('rel', 'noopener noreferrer');
            const href = child.getAttribute('href') || '';
            if (href.startsWith('javascript:') || href.startsWith('data:')) {
                child.removeAttribute('href');
            }
        }

        // Recursively sanitize children
        if (child.children.length > 0) {
            sanitizeElement(child);
        }
    }

    // Remove disallowed elements
    for (const child of childrenToRemove) {
        element.removeChild(child);
    }
}

function basicSanitize(html: string): string {
    // Basic fallback sanitization
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '');
}

/**
 * Escapes HTML entities to prevent XSS in text content
 * Use this for user-generated text that should NOT contain HTML
 */
export function escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Validates and sanitizes URLs
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
        return '';
    }

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    if (
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('vbscript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('file:')
    ) {
        return '';
    }

    // Allow only safe protocols
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('#')
    ) {
        return url;
    }

    // Default to https for bare domains
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
        return `https://${url}`;
    }

    return '';
}
