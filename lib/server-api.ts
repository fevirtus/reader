const apiBaseUrl = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

export class ReaderApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function buildApiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

export async function readerApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    cache: init?.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const data = await response.json()
      detail = data?.detail || data?.error || detail
    } catch {}

    throw new ReaderApiError(response.status, `Reader API error ${response.status}: ${detail}`)
  }

  return response.json() as Promise<T>
}

export async function readerApiFetchNullable<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    return await readerApiFetch<T>(path, init)
  } catch (error) {
    if (error instanceof ReaderApiError && error.status === 404) {
      return null
    }
    throw error
  }
}