import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  
  if (!filename) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const sanitizedFilename = path.basename(filename)
  const filePath = path.join(process.cwd(), "public", "uploads", "covers", sanitizedFilename)

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    const ext = path.extname(sanitizedFilename).toLowerCase()
    let contentType = "image/jpeg"
    if (ext === ".png") contentType = "image/png"
    else if (ext === ".webp") contentType = "image/webp"
    else if (ext === ".gif") contentType = "image/gif"
    else if (ext === ".svg") contentType = "image/svg+xml"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
