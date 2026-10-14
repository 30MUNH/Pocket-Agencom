import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaApi } from '../api/mediaApi';

/**
 * Resolves an asset ID only when its element approaches the viewport. Signed
 * URLs live in component memory only and refresh shortly before expiration.
 */
export function useAuthorizedMediaUrl({ assetId, legacyUrl, enabled = true, accessRequest = mediaApi.getAssetAccess }) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [signed, setSigned] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);

  useEffect(() => {
    setSigned(null);
    setImageRetryCount(0);
    setVisible(false);
  }, [assetId]);

  useEffect(() => {
    if (!enabled || !assetId) return undefined;
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '160px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [assetId, enabled]);

  const refresh = useCallback(() => setRequestVersion((version) => version + 1), []);

  useEffect(() => {
    if (!assetId || !visible || !enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    accessRequest(assetId).then((response) => {
      if (!cancelled) setSigned({ assetId, url: response?.url, expiresAt: response?.expiresAt });
    }).catch(() => {
      if (!cancelled) setSigned(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [assetId, visible, enabled, accessRequest, requestVersion]);

  useEffect(() => {
    if (!signed?.expiresAt) return undefined;
    const refreshIn = Math.max(1000, new Date(signed.expiresAt).getTime() - Date.now() - 30_000);
    const timer = setTimeout(refresh, refreshIn);
    return () => clearTimeout(timer);
  }, [signed, refresh]);

  const onError = useCallback((event) => {
    if (!assetId || !signed?.url || imageRetryCount >= 1) return;
    setImageRetryCount((count) => count + 1);
    refresh();
    if (event?.currentTarget) event.currentTarget.removeAttribute('src');
  }, [assetId, signed?.url, imageRetryCount, refresh]);

  return {
    ref: elementRef,
    url: assetId ? (signed?.assetId === assetId ? signed?.url || null : null) : (legacyUrl || null),
    loading,
    onError: assetId && !legacyUrl ? onError : undefined,
    refresh,
  };
}
