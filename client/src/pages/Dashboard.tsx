import { useQuery } from '@tanstack/react-query'
import { statsApi, linksApi } from '@/lib/api'
import { Link } from 'react-router-dom'
import { 
  BarChart3, Link as LinkIcon, Eye, TrendingUp, 
  Plus, Clock, Tag, ExternalLink
} from 'lucide-react'
import { formatNumber, formatRelativeTime } from '@/lib/utils'

export default function Dashboard() {
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => statsApi.getDashboard(),
  })

  const { data: recentLinks } = useQuery({
    queryKey: ['links', 'recent'],
    queryFn: () => linksApi.getAll({ limit: 5 }),
  })

  const stats = dashboardData?.data?.overview

  return (
    <div className="min-h-screen bg-gray-50 p-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's an overview of your links
          </p>
        </div>
        <Link to="/app/links" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Link
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-slideInUp">
        <StatCard
          label="Total Links"
          value={stats?.total_links || 0}
          icon={LinkIcon}
          color="blue"
          trend="+12%"
        />
        <StatCard
          label="Total Visits"
          value={stats?.total_visits || 0}
          icon={Eye}
          color="green"
          trend="+18%"
        />
        <StatCard
          label="Last 24 Hours"
          value={stats?.visits_last_24h || 0}
          icon={TrendingUp}
          color="purple"
          trend="+8%"
        />
        <StatCard
          label="Active Links"
          value={stats?.active_links || 0}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Recent Links */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Links
              </h2>
              <Link
                to="/app/links"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All →
              </Link>
            </div>

            {recentLinks?.data?.data && recentLinks.data.data.length > 0 ? (
              <div className="space-y-3">
                {recentLinks.data.data.map((link: any) => (
                  <div
                    key={link.id}
                    className="group rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:shadow-glow hover:-translate-y-1 duration-300 animate-slideInRight"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            /{link.address}
                          </h3>
                          {link.tags && link.tags.length > 0 && (
                            <div className="flex gap-1">
                              {link.tags.slice(0, 2).map((tag: any) => (
                                <span
                                  key={tag.id}
                                  className="badge text-xs"
                                  style={{
                                    backgroundColor: tag.color + '20',
                                    color: tag.color,
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <a
                          href={link.target}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 truncate"
                        >
                          {link.target}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(link.visit_count)} visits
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(link.created_at)}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/app/links/${link.id}/stats`}
                        className="btn-secondary p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No links yet</p>
                <Link to="/app/links" className="btn-primary">
                  Create Your First Link
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/app/links"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-all hover:border-primary-300 hover:bg-primary-50"
              >
                <div className="rounded-lg bg-blue-100 p-2">
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Links</p>
                  <p className="text-xs text-gray-600">View and edit links</p>
                </div>
              </Link>
              <Link
                to="/app/tags"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-all hover:border-primary-300 hover:bg-primary-50"
              >
                <div className="rounded-lg bg-green-100 p-2">
                  <Tag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tags</p>
                  <p className="text-xs text-gray-600">Organize with tags</p>
                </div>
              </Link>
              <Link
                to="/app/settings"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-all hover:border-primary-300 hover:bg-primary-50"
              >
                <div className="rounded-lg bg-purple-100 p-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-600">View statistics</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
            <h3 className="mb-2 font-semibold text-primary-900">💡 Pro Tip</h3>
            <p className="text-sm text-primary-700">
              Use tags to organize your links and track campaign performance
              with UTM parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
  trend?: string
}

function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-xl p-3 ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
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
