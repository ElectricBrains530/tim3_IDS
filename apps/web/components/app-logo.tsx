import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 120, // Adjusted default width for new aspect ratio
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      src="/images/tim3wordmark.svg"
      alt="App Logo"
      width={width}
      height={Math.round(width * (836 / 1254))}
      className={cn(className)}
      priority
    />
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
