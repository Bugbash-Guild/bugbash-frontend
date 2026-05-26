import Image from 'next/image';

import { cn } from '@/lib/cn';
import { getMonsterArtwork } from '@/lib/monsterArtwork';

type Props = {
    id?: string | null;
    name?: string | null;
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
};

export function MonsterVisual({
    id,
    name,
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
}: Props) {
    const artwork = getMonsterArtwork({ id, name, formStage, level, awakeningState });
    const label = alt ?? name ?? artwork?.alt ?? 'monster';

    if (!artwork) {
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
                priority={priority}
                sizes={sizes}
                src={artwork.src}
            />
        </span>
    );
}
