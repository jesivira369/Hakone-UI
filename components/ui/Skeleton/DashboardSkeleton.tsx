import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="grid gap-6 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="w-32 h-32 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="w-full h-64 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
