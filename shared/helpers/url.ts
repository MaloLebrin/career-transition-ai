export function isUrl(url: string): boolean {
  return url.startsWith('http') || url.startsWith('https')
}
