export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-30/50 p-4 sm:p-6 shadow-sm animate-pulse bg-brand-30 min-h-[160px]">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-3/4 bg-brand-60 rounded-md"></div>
        <div className="flex items-center gap-4 mt-2">
          <div className="h-4 w-1/4 bg-brand-60 rounded-md"></div>
          <div className="h-4 w-1/4 bg-brand-60 rounded-md"></div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-4">
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-brand-60 rounded-xl"></div>
          <div className="h-6 w-24 bg-brand-60 rounded-xl"></div>
        </div>
        <div className="h-5 w-24 bg-brand-60 rounded-md"></div>
      </div>
    </div>
  );
}
