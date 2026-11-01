/** Build the Messages endpoint without duplicating a gateway's existing /v1 prefix. */
export function courseAiMessagesEndpoint(baseUrl) {
  const endpoint = new URL(baseUrl)
  const basePath = endpoint.pathname.replace(/\/+$/, '')
  endpoint.pathname = `${basePath}${basePath.endsWith('/v1') ? '/messages' : '/v1/messages'}`
  endpoint.search = ''
  endpoint.hash = ''
  return endpoint.toString()
}

/**
 * Fetch options for Anthropic Messages requests. redirect: 'error' is mandatory:
 * Node fetch follows cross-origin redirects without stripping the custom x-api-key header.
 */
export function courseAiRequestInit({ apiKey, payload, timeoutMs = 120_000 }) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'error'
  }
}
