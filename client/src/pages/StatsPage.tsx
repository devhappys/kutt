import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { statsApi, linksApi } from '@/lib/api'
import { 
  TrendingUp, Users, Eye, Clock, Globe, Monitor, Download, 
  ArrowLeft, MapPin, Smartphone, MousePointer,
  ExternalLink, Activity
} from 'lucide-react'
import { formatNumber, formatRelativeTime, downloadBlob } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function StatsPage() {
  const { linkId } = useParams<{ linkId: string }>()

  // Get link stats (includes link info + historical stats)
  const { data: linkStatsData, isLoading: isLoadingLink, error: linkError } = useQuery({
    queryKey: ['link', 'stats', linkId],
    queryFn: () => linksApi.getStats(linkId!),
    enabled: !!linkId,
  })

  // Get real-time stats
  const { data: realtimeData, error: realtimeError } = useQuery({
    queryKey: ['stats', 'realtime', linkId],
    queryFn: () => statsApi.getRealtime(linkId!),
    refetchInterval: 30000,
    enabled: !!linkId,
  })

  // Get UTM stats
  const { data: utmData } = useQuery({
    queryKey: ['stats', 'utm', linkId],
    queryFn: () => statsApi.getUTMStats(linkId!),
    enabled: !!linkId,
  })

  // Get device stats
  const { data: deviceData } = useQuery({
    queryKey: ['stats', 'devices', linkId],
    queryFn: () => statsApi.getDeviceStats(linkId!),
    enabled: !!linkId,
  })

  const link = linkStatsData?.data
  const realtime = realtimeData?.data

  // Handle errors with user-friendly messages
  if (linkError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Link stats error:', linkError)
    }
    toast.error('Failed to load link statistics')
  }
  if (realtimeError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Realtime stats error:', realtimeError)
    }
    toast.error('Failed to load realtime statistics')
  }

  const handleExport = async (format: 'csv' | 'json') => {
    if (!linkId) {
      toast.error('Link ID is missing')
      return
    }
    try {
      const response = await statsApi.exportData(linkId, format)
      downloadBlob(response.data, `stats-${linkId}.${format}`)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  if (!linkId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link ID Missing</h2>
          <p className="text-gray-600 mb-4">No link ID was provided in the URL.</p>
          <Link to="/app/links" className="btn-primary">
            Back to Links
          </Link>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoadingLink) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="card max-w-md mx-auto text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (linkError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Link</h2>
          <p className="text-gray-600 mb-4">
            {(linkError as any)?.response?.data?.message || 'Failed to load link statistics'}
          </p>
          <Link to="/app/links" className="btn-primary">
            Back to Links
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/app/links" className="mb-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Links
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Link Analytics</h1>
            {link && (
              <div className="mt-2 space-y-1">
                <p className="text-lg font-medium text-gray-700">/{link.address}</p>
                <a
                  href={link.target}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
                >
                  {link.target}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-primary-600" />
            Real-time Activity
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Live • Updates every 30s</span>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Now"
            value={realtime?.active_visitors || 0}
            icon={Users}
            color="green"
            subtitle="Last 5 minutes"
          />
          <StatCard
            label="Last 15 Minutes"
            value={realtime?.last_15_min || 0}
            icon={Clock}
            color="blue"
          />
          <StatCard
            label="Last Hour"
            value={realtime?.last_hour || 0}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            label="Last 24 Hours"
            value={realtime?.last_24_hours || 0}
            icon={Eye}
            color="orange"
          />
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
          <MousePointer className="h-5 w-5 text-primary-600" />
          Recent Visitors
          <span className="ml-2 text-sm font-normal text-gray-500">(Last hour)</span>
        </h2>
        {realtime?.recent_visits && realtime.recent_visits.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Device</th>
                    <th>Browser</th>
                    <th>OS</th>
                    <th>Referrer</th>
                    <th>Campaign</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {realtime.recent_visits.map((visit: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="uppercase">{visit.country || '—'}</span>
                          {visit.city && <span className="text-gray-500">• {visit.city}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="capitalize">{visit.device_type || 'Desktop'}</span>
                      </td>
                      <td>
                        <span className="capitalize">{visit.browser || 'Unknown'}</span>
                      </td>
                      <td>
                        <span className="capitalize">{visit.os || 'Unknown'}</span>
                      </td>
                      <td>
                        {visit.referrer_domain ? (
                          <span className="text-sm text-gray-700">{visit.referrer_domain}</span>
                        ) : (
                          <span className="text-gray-400">Direct</span>
                        )}
                      </td>
                      <td>
                        {visit.utm_campaign ? (
                          <span className="badge bg-primary-100 text-primary-800">
                            {visit.utm_campaign}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-gray-600 whitespace-nowrap">
                        {formatRelativeTime(visit.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-gray-100 p-4">
                <MousePointer className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent visitors</h3>
            <p className="text-gray-600">
              Visitors will appear here once someone clicks on this link
            </p>
          </div>
        )}
      </div>

      {/* UTM Campaigns */}
      {utmData?.data && utmData.data.campaigns?.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Top Marketing Campaigns</h2>
          <div className="card">
            <div className="space-y-4">
              {utmData.data.campaigns.slice(0, 8).map((campaign: any, idx: number) => (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-semibold">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{formatNumber(campaign.visits)} visits</span>
                          <span>{formatNumber(campaign.unique_visitors)} unique</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(campaign.visits)}
                      </p>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                      style={{
                        width: `${(campaign.visits / utmData.data.campaigns[0].visits) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Device & Browser Stats */}
      {deviceData?.data && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Device Types */}
          <div className="card">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Smartphone className="h-5 w-5 text-primary-600" />
              Device Types
            </h3>
            <div className="space-y-4">
              {deviceData.data.device_types.map((device: any, idx: number) => (
                <DeviceBar
                  key={idx}
                  label={device.type}
                  value={device.count}
                  max={deviceData.data.device_types[0].count}
                  color="blue"
                />
              ))}
            </div>
          </div>

          {/* Browsers */}
          <div className="card">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Globe className="h-5 w-5 text-primary-600" />
              Top Browsers
            </h3>
            <div className="space-y-4">
              {deviceData.data.browsers.slice(0, 5).map((browser: any, idx: number) => (
                <DeviceBar
                  key={idx}
                  label={browser.name}
                  value={browser.count}
                  max={deviceData.data.browsers[0].count}
                  color="green"
                />
              ))}
            </div>
          </div>

          {/* Operating Systems */}
          <div className="card">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Monitor className="h-5 w-5 text-primary-600" />
              Operating Systems
            </h3>
            <div className="space-y-4">
              {deviceData.data.operating_systems.slice(0, 5).map((os: any, idx: number) => (
                <DeviceBar
                  key={idx}
                  label={os.name}
                  value={os.count}
                  max={deviceData.data.operating_systems[0].count}
                  color="purple"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  color: 'green' | 'blue' | 'purple' | 'orange'
  trend?: string
  subtitle?: string
}

function StatCard({ label, value, icon: Icon, color, trend, subtitle }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600">{trend}</span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

interface DeviceBarProps {
  label: string
  value: number
  max: number
  color: 'blue' | 'green' | 'purple'
}

function DeviceBar({ label, value, max, color }: DeviceBarProps) {
  const percentage = (value / max) * 100
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium capitalize text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{formatNumber(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
