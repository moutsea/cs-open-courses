/** Stateless, expiring admin sessions. The password also invalidates old signatures when rotated. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const SESSION_CONTEXT = 'cs61bbeyond:admin-session:v2'
const encoder = new TextEncoder()

async function signingKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function sessionToken(password: string, now = Date.now()): Promise<string> {
  const issuedAt = Math.floor(now / 1000)
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS
  const nonce = hex(crypto.getRandomValues(new Uint8Array(16)))
  const payload = `v2.${issuedAt}.${expiresAt}.${nonce}`
  const signature = await crypto.subtle.sign('HMAC', await signingKey(password), encoder.encode(`${SESSION_CONTEXT}:${payload}`))
  return `${payload}.${hex(new Uint8Array(signature))}`
}

export async function verifySessionToken(token: string, password: string, now = Date.now()): Promise<boolean> {
  // Reject the previous perpetual token format and malformed input before doing crypto work.
  const parts = /^v2\.(\d{1,12})\.(\d{1,12})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token)
  if (!parts || !password) return false
  const issuedAt = Number(parts[1])
  const expiresAt = Number(parts[2])
  const currentTime = Math.floor(now / 1000)
  if (issuedAt > currentTime || expiresAt <= currentTime || expiresAt - issuedAt !== ADMIN_SESSION_MAX_AGE_SECONDS) return false
  const payload = token.slice(0, token.lastIndexOf('.'))
  const signature = Uint8Array.from(parts[4].match(/../g)!, byte => parseInt(byte, 16))
  return crypto.subtle.verify('HMAC', await signingKey(password), signature, encoder.encode(`${SESSION_CONTEXT}:${payload}`))
}
