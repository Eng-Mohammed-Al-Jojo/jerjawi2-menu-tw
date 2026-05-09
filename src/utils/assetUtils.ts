/**
 * Safely resolves an asset path by prepending the Vite BASE_URL and handling slashes.
 */
export function getAssetUrl(path: string): string {
  if (!path) return "";
  
  // If it's already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  const base = import.meta.env.BASE_URL || "/";
  
  // Normalize path (remove leading slash if present to avoid double slashes with base)
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Ensure base ends with a slash
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  
  return `${normalizedBase}${normalizedPath}`;
}
