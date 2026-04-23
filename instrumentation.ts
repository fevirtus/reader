/**
 * Next.js Instrumentation Hook — chạy một lần khi server khởi động.
 *
 * Mục đích:
 * 1. Ép IPv4-first để tránh Happy Eyeballs timeout khi gọi Google OAuth
 *    (openid-client bên trong NextAuth gọi oauth2.googleapis.com).
 * 2. Tắt keep-alive trên global https agent để tránh stale connection:
 *    Sau lần đăng nhập đầu, connection pool giữ lại TCP socket tới Google.
 *    NAT/firewall của Docker drop socket này sau vài phút (silently).
 *    Khi đăng nhập lần 2, openid-client cố reuse socket đã chết → treo 3500ms.
 *    keepAlive: false buộc mở connection mới mỗi request, không reuse pool cũ.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setDefaultResultOrder } = await import("dns")
    setDefaultResultOrder("ipv4first")

    const https = await import("https")
    https.globalAgent = new https.Agent({
      keepAlive: false,
    })

    const http = await import("http")
    http.globalAgent = new http.Agent({
      keepAlive: false,
    })
  }
}
