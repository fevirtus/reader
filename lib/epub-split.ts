export type EpubSplitMode = "toc" | "regex" | "tag"

export const EPUB_HTML_TAG_PRESETS = [
  { id: "a", name: "Thẻ <a> (anchor / mục lục liên kết)", tag: "a" },
  { id: "h2", name: "Thẻ <h2>", tag: "h2" },
  { id: "h1", name: "Thẻ <h1>", tag: "h1" },
  { id: "h3", name: "Thẻ <h3>", tag: "h3" },
  { id: "p", name: "Thẻ <p>", tag: "p" },
] as const

export const DEFAULT_EPUB_CHAPTER_TAG = "a"

export function splitModeLabel(mode: string | undefined): string {
  if (mode === "regex") return "Regex"
  if (mode === "tag") return "Thẻ HTML"
  return "TOC"
}

export function appendEpubSplitFormFields(
  form: FormData,
  splitMode: EpubSplitMode,
  options?: { chapterRegex?: string; chapterTag?: string },
) {
  form.append("splitMode", splitMode)
  if (splitMode === "regex" && options?.chapterRegex) {
    form.append("chapterRegex", options.chapterRegex)
  }
  if (splitMode === "tag") {
    form.append("chapterTag", (options?.chapterTag || DEFAULT_EPUB_CHAPTER_TAG).trim() || DEFAULT_EPUB_CHAPTER_TAG)
  }
}
