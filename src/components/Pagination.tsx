import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath?: string
}

export function Pagination({ currentPage, totalPages, basePath = '' }: PaginationProps) {
  const router = useRouter()

  // Preload adjacent pages for faster navigation
  useEffect(() => {
    const preloadPage = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        router.prefetch(`${basePath}/${page}`)
      }
    }

    preloadPage(currentPage - 1)
    preloadPage(currentPage + 1)
    preloadPage(currentPage + 2)
    if (currentPage > 2) preloadPage(currentPage - 2)
  }, [currentPage, totalPages, basePath, router])

  const generatePageNumbers = () => {
    const pages: (number | string)[] = []
    const delta = 2

    pages.push(1)

    if (currentPage > delta + 2) {
      pages.push('...')
    }

    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    if (currentPage < totalPages - delta - 1) {
      pages.push('...')
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  return (
    <nav 
      className="flex items-center justify-center space-x-2 py-8"
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Link 
          href={`${basePath}/${currentPage - 1}`}
          className="pagination-button pagination-button-primary group"
        >
          <svg 
            className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Link>
      ) : (
        <button 
          disabled 
          className="pagination-button pagination-button-disabled"
        >
          Previous
        </button>
      )}

      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-slate-500 select-none">...</span>
            ) : (
              <Link
                href={`${basePath}/${page}`}
                className={`pagination-number ${
                  page === currentPage 
                    ? 'pagination-number-active' 
                    : 'pagination-number-default'
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Link>
            )}
          </div>
        ))}
      </div>

      {currentPage < totalPages ? (
        <Link 
          href={`${basePath}/${currentPage + 1}`}
          className="pagination-button pagination-button-primary group"
        >
          Next
          <svg 
            className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <button 
          disabled 
          className="pagination-button pagination-button-disabled"
        >
          Next
        </button>
      )}

      <div className="hidden sm:flex items-center ml-8 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
        <span className="font-medium text-slate-800">Page {currentPage}</span>
        <span className="mx-2 text-slate-400">of</span>
        <span className="font-medium text-slate-800">{totalPages}</span>
      </div>
    </nav>
  )
}
