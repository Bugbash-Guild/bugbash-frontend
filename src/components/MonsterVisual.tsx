'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';
import { shouldUseUnoptimizedGameImage } from '@/lib/gameImageOptimization';
import { getMonsterArtwork } from '@/lib/monsterArtwork';
import type { MonsterFormStage } from '@/types/monster';

type Props = {
    id?: string | null;
    name?: string | null;
    assetUrl?: string | null;
    artworkByStage?: Partial<Record<MonsterFormStage, string>>;
    formStage?: string | null;
    level?: number | null;
    awakeningState?: string | null;
    emoji: string;
    alt?: string;
    className?: string;
    imageClassName?: string;
    emojiClassName?: string;
    sizes?: string;
    priority?: boolean;
    unoptimized?: boolean;
};

export function MonsterVisual({
    id,
    name,
    assetUrl,
    artworkByStage,
    formStage,
    level,
    awakeningState,
    emoji,
    alt,
    className,
    imageClassName,
    emojiClassName,
    sizes = '80px',
    priority = false,
    unoptimized,
}: Props) {
    const artwork = getMonsterArtwork({
        id,
        name,
        assetUrl,
        artworkByStage,
        formStage,
        level,
        awakeningState,
    });
    const label = alt ?? name ?? artwork?.alt ?? 'monster';
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const src = artwork?.src;

    useEffect(() => {
        setFailedSrc(null);
    }, [src]);

    if (!artwork || src === failedSrc) {
        return (
            <span
                aria-label={label}
                className={cn('inline-flex shrink-0 items-center justify-center', className, emojiClassName)}
                role="img"
            >
                {emoji}
            </span>
        );
    }

    return (
        <span
            className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden', className)}
        >
            <Image
                alt={label}
                className={cn('object-contain', imageClassName)}
                fill
                onError={() => setFailedSrc(artwork.src)}
                priority={priority}
                sizes={sizes}
                unoptimized={shouldUseUnoptimizedGameImage({ src: artwork.src, sizes, unoptimized })}
                src={artwork.src}
            />
        </span>
    );
}
