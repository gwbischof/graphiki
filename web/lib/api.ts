const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a path with the app's basePath for client-side fetch calls. */
export function apiUrl(path: string): string {
  return `${basePath}${path}`;
}
