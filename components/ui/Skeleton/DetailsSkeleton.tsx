import { Skeleton } from "@/components/ui/skeleton";

export function DetailsSkeleton() {
    return (
        <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-2" />
            </div>
        </div>
    );
}