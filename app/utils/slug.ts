/**
 * Génère un slug à partir d'une chaîne (minuscules, espaces → tirets, caractères non autorisés supprimés).
 * Réduit les tirets multiples et supprime les tirets en début/fin.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
