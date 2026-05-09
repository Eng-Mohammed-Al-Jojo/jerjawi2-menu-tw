
export default function MenuSkeleton() {
  const categories = [1, 2];

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* Search Bar Skeleton */}
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="h-16 w-full bg-white/10 rounded-3xl border border-white/5" />
      </div>

      {/* Tabs / Navigation Skeleton */}
      <div className="flex gap-3 overflow-hidden pb-8 no-scrollbar snap-x">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 w-28 bg-white/10 rounded-2xl shrink-0 border border-white/5" />
        ))}
      </div>

      {/* Categories Sections */}
      <div className="space-y-12">
        {categories.map((cat) => (
          <div key={cat} className="space-y-8">

            {/* Section Header */}
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-primary/20 rounded-full" />
              <div className="h-8 w-1/4 min-w-[120px] bg-white/10 rounded-xl" />
            </div>

            {/* Items Grid - Matching ItemRow layout exactly */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-white/5 rounded-4xl border border-white/5 relative overflow-hidden flex flex-col h-full will-change-transform"
                >
                  <div className="aspect-4/3 bg-white/5 relative overflow-hidden">
                    {/* Shimmer on image area */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent z-10" />
                  </div>
                  <div className="p-4 space-y-3 flex-1">
                    <div className="flex justify-between gap-4">
                      <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                      <div className="h-4 w-1/4 bg-primary/20 rounded-full" />
                    </div>
                    <div className="h-3 w-1/2 bg-white/5 rounded-full" />
                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-center">
                      <div className="h-2 w-1/3 bg-white/5 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
