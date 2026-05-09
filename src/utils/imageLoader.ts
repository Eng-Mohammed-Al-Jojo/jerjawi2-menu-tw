import { getAssetUrl } from "./assetUtils";

/**
 * Production-grade dynamic image loader for Vite projects.
 * Fetches the build-time generated manifest from the public folder.
 */

export interface ImageManifest {
    images: string[];
    payment: string[];
}

let manifestCache: ImageManifest | null = null;
let fetchPromise: Promise<ImageManifest> | null = null;

/**
 * Fetches and caches the image manifest from /public/manifest.json
 */
async function fetchManifest(): Promise<ImageManifest> {
    if (manifestCache) return manifestCache;
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
        try {
            // Use asset utility to resolve manifest path correctly
            const manifestUrl = getAssetUrl('manifest.json');
            const response = await fetch(`${manifestUrl}?v=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.statusText}`);
            }
            const data = await response.json();
            manifestCache = data;
            return data;
        } catch (error) {
            console.error('❌ Error loading image manifest:', error);
            return { images: [], payment: [] };
        } finally {
            fetchPromise = null;
        }
    })();

    return fetchPromise;
}

/**
 * Loads images of a specific type (product images or payment icons)
 * @param type 'images' | 'payment'
 * @returns Promise<string[]> Array of full URLs
 */
export async function loadImages(type: 'images' | 'payment'): Promise<string[]> {
    const manifest = await fetchManifest();
    const paths = manifest[type] || [];
    
    // Sort alphabetically and return full URLs resolved via asset utility
    return paths
        .sort((a, b) => a.localeCompare(b))
        .map(path => getAssetUrl(path));
}

/**
 * Pre-fetches the manifest to avoid latency on first mount
 */
export function prefetchManifest() {
    fetchManifest();
}

