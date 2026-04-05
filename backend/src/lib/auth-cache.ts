
// Shared cache for authentication results to prevent request storms
// Especially useful when local HS256 verification fails for ES256 tokens

const CACHE_TTL = 300000; // 5 minutes

export interface CachedAuth {
    id: string;
    email: string;
    role?: string;
    expires: number;
}

// Maps token -> user data
export const authFallbackCache = new Map<string, CachedAuth>();

export function getCachedAuth(token: string): CachedAuth | null {
    const cached = authFallbackCache.get(token);
    if (cached && cached.expires > Date.now()) {
        return cached;
    }
    return null;
}

export function setCachedAuth(token: string, user: { id: string; email: string; role?: string }) {
    authFallbackCache.set(token, {
        ...user,
        expires: Date.now() + CACHE_TTL
    });
}
