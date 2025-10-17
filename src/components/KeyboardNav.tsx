'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface KeyboardNavProps {
  currentPage: number
  totalPages: number
}

export function KeyboardNav({ currentPage, totalPages }: KeyboardNavProps) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not focused on an input element
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'h':
          if (currentPage > 1) {
            event.preventDefault()
            router.push(`/${currentPage - 1}`)
          }
          break
        case 'ArrowRight':
        case 'l':
          if (currentPage < totalPages) {
            event.preventDefault()
            router.push(`/${currentPage + 1}`)
          }
          break
        case 'Home':
        case 'g':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push('/1')
          }
          break
        case 'End':
        case 'G':
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            event.preventDefault()
            router.push(`/${totalPages}`)
          }
          break
        case '?':
          event.preventDefault()
          setShowHelp(!showHelp)
          break
        case 'Escape':
          if (showHelp) {
            event.preventDefault()
            setShowHelp(false)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages, router, showHelp])

  return (
    <>
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Previous page</span>
                <div className="flex items-center space-x-1">
                  <kbd className="kbd">←</kbd>
                  <span className="text-slate-400">or</span>
                  <kbd className="kbd">H</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Next page</span>
                <div className="flex items-center space-x-1">
                  <kbd className="kbd">→</kbd>
                  <span className="text-slate-400">or</span>
                  <kbd className="kbd">L</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">First page</span>
                <kbd className="kbd">Ctrl + G</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Last page</span>
                <kbd className="kbd">Ctrl + Shift + G</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Show help</span>
                <kbd className="kbd">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcut indicator */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
            <span>Press</span>
            <kbd className="kbd">?</kbd>
            <span>for shortcuts</span>
          </div>
        </button>
      </div>
    </>
  )
}