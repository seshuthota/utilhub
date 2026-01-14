
/**
 * Base64URL decode helper
 */
function base64UrlDecode(str) {
    // Add padding if needed
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0: break;
        case 2: output += '=='; break;
        case 3: output += '='; break;
        default: throw new Error('Illegal base64url string');
    }

    try {
        // Decode base64 and handle UTF-8 characters correctly
        return decodeURIComponent(atob(output).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        return atob(output);
    }
}

/**
 * Decode JWT token without verification
 * @param {string} token 
 */
export function decodeJwt(token) {
    if (!token) return { header: null, payload: null, signature: null, error: null };

    const parts = token.split('.');

    if (parts.length !== 3) {
        return { header: null, payload: null, signature: null, error: 'Invalid token structure (must have 3 parts)' };
    }

    try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const signature = parts[2];

        return { header, payload, signature, error: null };
    } catch (e) {
        return { header: null, payload: null, signature: null, error: 'Failed to decode base64 components' };
    }
}

/**
 * Check if token is expired
 * @param {object} payload 
 */
export function isJwtExpired(payload) {
    if (!payload || !payload.exp) return false;
    // JWT exp is in seconds
    return Date.now() >= payload.exp * 1000;
}

/**
 * Get human readable expiration status
 * @param {number} exp - Expiration timestamp in seconds
 */
export function getExpirationStatus(exp) {
    if (!exp) return { status: 'none', text: 'No expiration set' };

    const expMs = exp * 1000;
    const now = Date.now();
    const isExpired = now >= expMs;
    const diff = Math.abs(now - expMs);

    // Format duration
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let durationText = '';
    if (days > 0) durationText = `${days} days`;
    else if (hours > 0) durationText = `${hours} hours`;
    else if (minutes > 0) durationText = `${minutes} mins`;
    else durationText = `${seconds} secs`;

    return {
        status: isExpired ? 'expired' : 'active',
        text: isExpired ? `Expired ${durationText} ago` : `Expires in ${durationText}`,
        isExpired
    };
}
