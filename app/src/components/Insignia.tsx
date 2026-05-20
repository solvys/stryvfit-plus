// [claude-code 2026-05-14] Insignia component using Stock/Logo.png

import Image from 'next/image';

export function Insignia({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/stryv-insignia.png"
      alt=""
      width={256}
      height={256}
      className={className}
      aria-hidden="true"
      priority
    />
  );
}
