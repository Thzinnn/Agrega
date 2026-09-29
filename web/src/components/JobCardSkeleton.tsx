export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-5 shadow-sm animate-pulse bg-white">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-2/3 bg-gray-200 rounded"></div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
