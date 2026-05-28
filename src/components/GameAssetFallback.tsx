import { cn } from '@/lib/cn';

type Props = {
    alt: string;
    className?: string;
    kind?: 'activity' | 'item' | 'monster';
};

export function GameAssetFallback({ alt, className, kind = 'item' }: Props) {
    return (
        <span
            aria-label={alt}
            className={cn(
                'relative inline-flex shrink-0 items-center justify-center overflow-hidden text-text-faint',
                className,
            )}
            role="img"
        >
            <span className="absolute inset-[12%] rounded-full border border-current/15 bg-current/[0.03]" />
            {kind === 'monster' && (
                <>
                    <span className="relative block h-[48%] w-[56%] rounded-t-[46%] rounded-b-[34%] border border-current/35 bg-current/10" />
                    <span className="absolute left-[39%] top-[42%] size-[5%] rounded-full bg-current/50" />
                    <span className="absolute right-[39%] top-[42%] size-[5%] rounded-full bg-current/50" />
                </>
            )}
            {kind === 'item' && (
                <span className="relative block size-[42%] rotate-45 rounded-[3px] border border-current/35 bg-current/10" />
            )}
            {kind === 'activity' && (
                <>
                    <span className="absolute left-[25%] top-[30%] size-[15%] rounded-full border border-current/35 bg-current/10" />
                    <span className="absolute right-[24%] top-[32%] size-[15%] rounded-full border border-current/35 bg-current/10" />
                    <span className="absolute bottom-[26%] left-[42%] size-[16%] rounded-full border border-current/35 bg-current/10" />
                    <span className="absolute left-[39%] top-[39%] h-px w-[23%] rotate-[18deg] bg-current/25" />
                    <span className="absolute bottom-[37%] left-[47%] h-px w-[18%] rotate-[112deg] bg-current/25" />
                </>
            )}
        </span>
    );
}
