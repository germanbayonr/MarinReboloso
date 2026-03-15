import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingProducto() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-28 lg:pt-32 pb-16 px-4 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

