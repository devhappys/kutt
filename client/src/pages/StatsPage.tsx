import { useState } from 'react'
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
  const dateRange = 'week' as 'day' | 'week' | 'month'

  const { data: linkData } = useQuery({
    queryKey: ['link', linkId],
    queryFn: () => linksApi.getAll({ search: linkId }),
  })

  const { data: realtimeData } = useQuery({
    queryKey: ['stats', 'realtime', linkId],
    queryFn: () => statsApi.getRealtime(linkId!),
    refetchInterval: 30000,
  })

  // Heatmap data query (currently unused but available for future features)
  // const { data: heatmapData } = useQuery({
  //   queryKey: ['stats', 'heatmap', linkId, dateRange],
  //   queryFn: () => statsApi.getHeatmap(linkId!, dateRange),
  // })

  const { data: utmData } = useQuery({
    queryKey: ['stats', 'utm', linkId],
    queryFn: () => statsApi.getUTMStats(linkId!),
  })

  const { data: deviceData } = useQuery({
    queryKey: ['stats', 'devices', linkId],
    queryFn: () => statsApi.getDeviceStats(linkId!),
  })

  const { data: visitsData } = useQuery({
    queryKey: ['stats', 'visits', linkId],
    queryFn: () => statsApi.getVisitDetails(linkId!, { limit: 10 }),
  })

  const link = linkData?.data?.data?.[0]
  const realtime = realtimeData?.data

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await statsApi.exportData(linkId!, format)
      downloadBlob(response.data, `stats-${linkId}.${format}`)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed')
    }
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
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Activity className="h-5 w-5 text-primary-600" />
          Real-time Activity
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Now"
            value={realtime?.active_visitors || 0}
            icon={Users}
            color="green"
            trend="+12%"
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
      {visitsData?.data?.data && visitsData.data.data.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <MousePointer className="h-5 w-5 text-primary-600" />
            Recent Visitors
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Device</th>
                    <th>Browser</th>
                    <th>Campaign</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visitsData.data.data.map((visit: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="uppercase">{visit.country}</span>
                          {visit.city && <span className="text-gray-500">• {visit.city}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="capitalize">{visit.device_type}</span>
                      </td>
                      <td>
                        <span className="capitalize">{visit.browser}</span>
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
                      <td className="text-gray-600">
                        {formatRelativeTime(visit.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
}

function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
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
