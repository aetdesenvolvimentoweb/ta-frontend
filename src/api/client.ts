const BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL
  if (import.meta.env.PROD && !url) {
    throw new Error(
      'VITE_API_URL não está definida no build de produção. Configure no painel do Cloudflare Pages.'
    )
  }
  return url ?? ''
})()

const LOGIN_PATH = '/artista/login'

type RequestOptions = Omit<RequestInit, 'body'> & { auth?: boolean; body?: unknown }

async function request<T>(
  path: string,
  { auth = false, body, ...init }: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(init.headers)

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = sessionStorage.getItem('jwt')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  if (res.status === 401 && auth) {
    sessionStorage.removeItem('jwt')
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith(LOGIN_PATH)) {
      window.location.assign(`${LOGIN_PATH}?expired=1`)
    }
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (data as { message?: string }).message ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
