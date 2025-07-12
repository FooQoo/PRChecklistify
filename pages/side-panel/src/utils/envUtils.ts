// Utility to get VITE_GEMINI_API_ENDPOINT from environment
export function isGeminiApiEnabled(): boolean {
  // Vite exposes env vars on import.meta.env
  // Fallback for test: check process.env as well
  const endpoint =
    (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_ENDPOINT) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_ENDPOINT);
  return !!(endpoint && typeof endpoint === 'string' && endpoint.trim() !== '' && endpoint !== 'undefined');
}
