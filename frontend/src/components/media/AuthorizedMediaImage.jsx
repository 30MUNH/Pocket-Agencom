import { useAuthorizedMediaUrl } from '../../hooks/useAuthorizedMediaUrl';

export default function AuthorizedMediaImage({
  assetId,
  legacyUrl,
  accessRequest,
  alt = '',
  className,
  fallback = null,
  onClick,
  ...props
}) {
  const { ref, url, onError, unavailable } = useAuthorizedMediaUrl({ assetId, legacyUrl, accessRequest });
  if (!url || unavailable) {
    return (
      <div ref={ref} onClick={onClick} className={`${className || ''} flex items-center justify-center text-xs text-on-surface-variant`} aria-label={alt || undefined} role={alt ? 'img' : undefined}>
        {fallback || (unavailable ? <span>Ảnh không khả dụng</span> : null)}
      </div>
    );
  }
  return <img ref={ref} src={url} alt={alt} className={className} onError={onError} onClick={onClick} {...props} />;
}
