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
  const { ref, url, onError } = useAuthorizedMediaUrl({ assetId, legacyUrl, accessRequest });
  if (!url) {
    return <div ref={ref} onClick={onClick} className={className} aria-label={alt || undefined} role={alt ? 'img' : undefined}>{fallback}</div>;
  }
  return <img ref={ref} src={url} alt={alt} className={className} onError={onError} onClick={onClick} {...props} />;
}
