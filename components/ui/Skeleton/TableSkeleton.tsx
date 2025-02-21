import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
    return (
        <div className="p-6">
            <Skeleton className="h-8 w-48 rounded mb-4" />
            <Skeleton className="w-full h-12 rounded mb-4" />
            {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="w-full h-10 rounded mb-2" />
            ))}
        </div>
    );
}
