export function BrandWordmark({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`logo-wordmark ${className}`.trim()} />;
}
