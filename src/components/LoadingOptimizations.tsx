'use client'

import { useEffect, useState } from 'react'

interface ProgressBarProps {
  isLoading: boolean
  duration?: number
}

export function ProgressBar({ isLoading, duration = 800 }: ProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        const increment = Math.random() * 10 + 5
        return Math.min(prev + increment, 90)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading])

  useEffect(() => {
    if (!isLoading && progress > 0) {
      setProgress(100)
      const timeout = setTimeout(() => setProgress(0), 500)
      return () => clearTimeout(timeout)
    }
  }, [isLoading, progress])

  if (progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div 
        className="h-1 bg-orange-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function QuickLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}