/** Taille lisible en français : « 512 o », « 12,3 Ko », « 4,5 Mo ». */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  const units = ['Ko', 'Mo', 'Go']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${String(rounded).replace('.', ',')} ${units[unit]}`
}
