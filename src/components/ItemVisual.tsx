import Image from 'next/image';

import { cn } from '@/lib/cn';

type Props = {
    assetUrl?: string | null;
    emoji: string;
    alt: string;
    className?: string;
    imageClassName?: string;
    emojiClassName?: string;
    sizes?: string;
    priority?: boolean;
};

export function ItemVisual({
    assetUrl,
    emoji,
    alt,
    className,
    imageClassName,
    emojiClassName,
    sizes = '48px',
    priority = false,
}: Props) {
    if (!assetUrl) {
        return (
            <span
                aria-label={alt}
                className={cn('inline-flex shrink-0 items-center justify-center', className, emojiClassName)}
                role="img"
            >
                {emoji}
            </span>
        );
    }

    return (
        <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden', className)}>
            <Image
                alt={alt}
                className={cn('object-contain', imageClassName)}
                fill
                priority={priority}
                sizes={sizes}
                src={assetUrl}
            />
        </span>
    );
}
