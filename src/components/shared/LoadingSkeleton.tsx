import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
    className?: string;
    count?: number;
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn('animate-pulse bg-muted rounded', className)}
                />
            ))}
        </>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <LoadingSkeleton className="h-12 flex-1" />
                    <LoadingSkeleton className="h-12 w-32" />
                    <LoadingSkeleton className="h-12 w-24" />
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="border border-border rounded-lg p-6 space-y-4">
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-2/3" />
        </div>
    );
}

export default LoadingSkeleton;
