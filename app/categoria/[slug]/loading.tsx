import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingCategoria() {
  return (
    <div className="pt-28 lg:pt-32 pb-16 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="mb-8">
        <Skeleton className="h-12 w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

