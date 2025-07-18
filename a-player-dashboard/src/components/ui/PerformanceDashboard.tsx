import React, { useState, useEffect } from 'react'
import { getPerformanceMonitor } from '../../utils/performance'
import { Card } from './Card'
import { Button } from './Button'

interface PerformanceMetrics {
  pageLoadTime?: number
  timeToInteractive?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  interactionToNextPaint?: number
  timeToFirstByte?: number
  memoryUsage?: number
  connectionType?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

interface PerformanceSummary {
  metrics: PerformanceMetrics
  interactionCount: number
  errorCount: number
  sessionDuration: number
}

export const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateSummary = () => {
      const monitor = getPerformanceMonitor()
      if (monitor) {
        setSummary(monitor.getPerformanceSummary())
      }
    }

    // Update every 5 seconds
    const interval = setInterval(updateSummary, 5000)
    updateSummary() // Initial update

    return () => clearInterval(interval)
  }, [])

  const handleExportData = () => {
    const monitor = getPerformanceMonitor()
    if (monitor) {
      const data = monitor.exportSessionData()
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const getPerformanceRating = (metric: string, value?: number): 'good' | 'needs-improvement' | 'poor' => {
    if (!value) return 'poor'
    
    switch (metric) {
      case 'lcp': // Largest Contentful Paint
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
      case 'fcp': // First Contentful Paint
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
      case 'cls': // Cumulative Layout Shift
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
      case 'inp': // Interaction to Next Paint
        return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor'
      case 'ttfb': // Time to First Byte
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
      default:
        return 'good'
    }
  }

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor'): string => {
    switch (rating) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
    }
  }

  const getRatingIcon = (rating: 'good' | 'needs-improvement' | 'poor'): string => {
    switch (rating) {
      case 'good': return '✅'
      case 'needs-improvement': return '⚠️'
      case 'poor': return '❌'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-full shadow-lg"
        >
          📊 Performance
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-white shadow-xl border border-gray-200">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleExportData}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
              >
                📥 Export
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 text-xs"
              >
                ✕
              </Button>
            </div>
          </div>

          {summary && (
            <div className="space-y-4">
              {/* Session Overview */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Session Overview</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Duration: {formatDuration(summary.sessionDuration)}</div>
                  <div>Device: {summary.metrics.deviceType || 'Unknown'}</div>
                  <div>Interactions: {summary.interactionCount}</div>
                  <div>Errors: {summary.errorCount}</div>
                </div>
              </div>

              {/* Core Web Vitals */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">Core Web Vitals</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'largestContentfulPaint', label: 'LCP', metric: 'lcp' },
                    { key: 'firstContentfulPaint', label: 'FCP', metric: 'fcp' },
                    { key: 'cumulativeLayoutShift', label: 'CLS', metric: 'cls' },
                    { key: 'interactionToNextPaint', label: 'INP', metric: 'inp' },
                    { key: 'timeToFirstByte', label: 'TTFB', metric: 'ttfb' }
                  ].map(({ key, label, metric }) => {
                    const value = summary.metrics[key as keyof PerformanceMetrics] as number
                    const rating = getPerformanceRating(metric, value)
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span>{label}:</span>
                        <span className={`flex items-center gap-1 ${getRatingColor(rating)}`}>
                          {getRatingIcon(rating)}
                          {metric === 'cls' ? value?.toFixed(3) || 'N/A' : formatDuration(value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">Additional Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Page Load:</span>
                    <span>{formatDuration(summary.metrics.pageLoadTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time to Interactive:</span>
                    <span>{formatDuration(summary.metrics.timeToInteractive)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage:</span>
                    <span>{formatBytes(summary.metrics.memoryUsage)}</span>
                  </div>
                  {summary.metrics.connectionType && (
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <span>{summary.metrics.connectionType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!summary && (
            <div className="text-center py-4 text-gray-500">
              Performance monitoring not available
            </div>
          )}
        </div>
      </Card>
    </div>
  )
} 