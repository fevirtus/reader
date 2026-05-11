import { Agent, fetch as undiciFetch } from "undici"

/** Tránh mặc định undici (headers/body ~300s) cắt kết nối khi API + NAS xử lý lâu. */
const longRunningAgent = new Agent({
  connectTimeout: 120_000,
  headersTimeout: 3_600_000,
  bodyTimeout: 3_600_000,
})

export async function readerApiLongFetch(
  input: string | URL,
  init?: RequestInit & { duplex?: "half" },
): Promise<Response> {
  const res = await undiciFetch(input, {
    ...init,
    dispatcher: longRunningAgent,
  } as Parameters<typeof undiciFetch>[1])
  return res as unknown as Response
}
