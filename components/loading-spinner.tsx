export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`} />
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-accent/50 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-accent rounded w-3/4 mb-2" />
          <div className="h-3 bg-accent rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}
