'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { GameAssetFallback } from '@/components/GameAssetFallback';
import { cn } from '@/lib/cn';
import { shouldUseUnoptimizedGameImage } from '@/lib/gameImageOptimization';

type Props = {
    assetUrl?: string | null;
    alt: string;
    className?: string;
    imageClassName?: string;
    sizes?: string;
    priority?: boolean;
    unoptimized?: boolean;
};

export function ItemVisual({
    assetUrl,
    alt,
    className,
    imageClassName,
    sizes = '48px',
    priority = false,
    unoptimized,
}: Props) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    useEffect(() => {
        setFailedSrc(null);
    }, [assetUrl]);

    if (!assetUrl || assetUrl === failedSrc) {
        return <GameAssetFallback alt={alt} className={className} kind="item" />;
    }

    return (
        <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden', className)}>
            <Image
                alt={alt}
                className={cn('object-contain', imageClassName)}
                fill
                onError={() => setFailedSrc(assetUrl)}
                priority={priority}
                sizes={sizes}
                unoptimized={shouldUseUnoptimizedGameImage({ src: assetUrl, sizes, unoptimized })}
                src={assetUrl}
            />
        </span>
    );
}
