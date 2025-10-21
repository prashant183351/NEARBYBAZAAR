// Client-side browser fingerprinting utility
export function getBrowserFingerprint(): string {
  // Use User-Agent, language, platform, canvas fingerprint
  const ua = navigator.userAgent;
  const lang = navigator.language;
  const platform = navigator.platform;
  let canvasHash = '';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('NearbyBazaarFingerprint', 10, 10);
    canvasHash = canvas.toDataURL();
  } catch {}
  // Simple hash (not cryptographically secure)
  const raw = `${ua}|${lang}|${platform}|${canvasHash}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash)}`;
}
