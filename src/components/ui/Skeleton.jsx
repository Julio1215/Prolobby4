// Skeleton loader base com animação pulse nativa
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-slate-800/80 rounded-xl ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-[70%]" />
        <Skeleton className="h-3.5 w-[45%]" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonNewsCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col w-full">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-2.5 w-15" />
          <Skeleton className="h-2.5 w-10" />
        </div>
        <Skeleton className="h-3.5 w-[90%]" />
        <Skeleton className="h-3.5 w-[75%]" />
        <Skeleton className="h-3 w-1/2 mt-1" />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-[65%]' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export default Skeleton