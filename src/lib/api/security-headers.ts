/**
 * Security Headers
 * HTTP security headers for application
 */

/**
 * Security headers to protect application
 */
export const securityHeaders: Record<string, string> = {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking by disallowing iframes
    "X-Frame-Options": "DENY",

    // Enable browser XSS filter
    "X-XSS-Protection": "1; mode=block",

    // Control referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Limit browser API access
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

/**
 * Content Security Policy

 */
export function getContentSecurityPolicy(nonce?: string): string {
    const policies = [
        "default-src 'self'",
        // Scripts: allow self, inline (for Next.js), and eval (for Phaser)
        `script-src 'self' 'unsafe-inline' 'unsafe-eval'${nonce ? ` 'nonce-${nonce}'` : ""}`,
        // Styles: allow self and inline (for CSS-in-JS)
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // Images: allow self, data URIs, and HTTPS sources
        "img-src 'self' data: blob: https: http://localhost:*",
        // Fonts
        "font-src 'self' https://fonts.gstatic.com data:",
        // Connect: allow API calls and WebSocket
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com",
        // Frame ancestors: prevent clickjacking
        "frame-ancestors 'none'",
        // Form actions
        "form-action 'self'",
        // Base URI
        "base-uri 'self'",
        // Object sources
        "object-src 'none'",
        // Upgrade insecure requests in production
        ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ];

    return policies.join("; ");
}

/**
 * Get all security headers including CSP

 */
export function getAllSecurityHeaders(nonce?: string): Record<string, string> {
    return {
        ...securityHeaders,
        "Content-Security-Policy": getContentSecurityPolicy(nonce),
    };
}

/**
 * Apply security headers to a Response

 */
export function applySecurityHeaders(
    response: Response,
    options: { includeCSP?: boolean; nonce?: string } = {}
): Response {
    const { includeCSP = false, nonce } = options;
    const headers = includeCSP ? getAllSecurityHeaders(nonce) : securityHeaders;

    Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}
