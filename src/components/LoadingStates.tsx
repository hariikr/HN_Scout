export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="story-card group animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-slate-200 rounded-lg w-12 h-8 flex items-center justify-center">
              <div className="bg-slate-300 rounded w-6 h-4"></div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-slate-200 rounded-lg h-6 w-3/4"></div>
              <div className="bg-slate-200 rounded-lg h-4 w-1/2"></div>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="bg-slate-200 rounded-lg h-5 w-full"></div>
            <div className="bg-slate-200 rounded-lg h-5 w-4/5"></div>
            <div className="bg-slate-200 rounded-lg h-5 w-2/3"></div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-200 rounded-full w-20 h-6"></div>
              <div className="bg-slate-200 rounded-full w-24 h-6"></div>
              <div className="bg-slate-200 rounded-full w-16 h-6"></div>
            </div>
            <div className="bg-slate-200 rounded-lg w-8 h-8"></div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="bg-slate-200 rounded-full w-32 h-5"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-slate-200 rounded-full w-8 h-4"></div>
                <div className="bg-slate-200 rounded-full w-8 h-4"></div>
                <div className="bg-slate-200 rounded-full w-8 h-4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ 
  message = "Something went wrong", 
  onRetry 
}: { 
  message?: string
  onRetry?: () => void 
}) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-slate-600 mb-6">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ message = "No stories found" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No stories found</h3>
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
    </div>
  )
}