import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { securityApi } from '@/lib/api'
import { 
  Shield, Plus, Trash2, X, Globe, Zap, ArrowRight, 
  ArrowLeft, AlertTriangle, CheckCircle, Edit2,
  Smartphone, Clock, Target
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SecurityPage() {
  const { linkId } = useParams<{ linkId: string }>()
  const [activeTab, setActiveTab] = useState<'ip' | 'geo' | 'rate' | 'redirect'>('ip')

  const tabs = [
    { 
      key: 'ip', 
      label: 'IP Rules', 
      icon: Shield, 
      desc: 'Control IP access',
      color: 'blue'
    },
    { 
      key: 'geo', 
      label: 'Geo Restrictions', 
      icon: Globe, 
      desc: 'Location-based access',
      color: 'green'
    },
    { 
      key: 'rate', 
      label: 'Rate Limits', 
      icon: Zap, 
      desc: 'Prevent abuse',
      color: 'yellow'
    },
    { 
      key: 'redirect', 
      label: 'Smart Redirects', 
      icon: ArrowRight, 
      desc: 'Device & location rules',
      color: 'purple'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/app/links" 
          className="mb-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Links
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security & Smart Redirects</h1>
            <p className="mt-2 text-gray-600">
              Configure access control and intelligent routing for this link
            </p>
          </div>
          
          <div className="rounded-lg bg-blue-50 px-4 py-2 border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Link ID: {linkId?.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Tab Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`card text-left transition-all hover:shadow-lg ${
              activeTab === tab.key 
                ? 'ring-2 ring-primary-600 shadow-md' 
                : 'hover:ring-1 hover:ring-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-3 ${
                activeTab === tab.key 
                  ? 'bg-primary-100' 
                  : 'bg-gray-100'
              }`}>
                <tab.icon className={`h-6 w-6 ${
                  activeTab === tab.key 
                    ? 'text-primary-600' 
                    : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${
                  activeTab === tab.key 
                    ? 'text-primary-900' 
                    : 'text-gray-900'
                }`}>
                  {tab.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{tab.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === 'ip' && <IPRulesSection linkId={linkId!} />}
        {activeTab === 'geo' && <GeoRestrictionsSection linkId={linkId!} />}
        {activeTab === 'rate' && <RateLimitsSection linkId={linkId!} />}
        {activeTab === 'redirect' && <SmartRedirectsSection linkId={linkId!} />}
      </div>
    </div>
  )
}

// ==================== IP Rules Section ====================
function IPRulesSection({ linkId }: { linkId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ip-rules', linkId],
    queryFn: () => securityApi.getIPRules(linkId),
  })

  const deleteRule = useMutation({
    mutationFn: securityApi.deleteIPRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-rules'] })
      toast.success('IP rule deleted')
    },
  })

  const rules = data?.data?.data || []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IP Access Control</h2>
          <p className="mt-1 text-gray-600">
            Whitelist or blacklist specific IP addresses to control access
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : rules.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex rounded-full bg-blue-100 p-4 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No IP Rules Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first IP rule to control which addresses can access this link
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2 inline" />
            Add First Rule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule: any) => (
            <div 
              key={rule.id} 
              className="card flex items-center justify-between hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`rounded-xl p-3 ${
                  rule.rule_type === 'whitelist' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {rule.rule_type === 'whitelist' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs font-semibold uppercase ${
                      rule.rule_type === 'whitelist'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rule.rule_type}
                    </span>
                    <span className="font-mono font-bold text-gray-900 text-lg">
                      {rule.ip_address || rule.ip_range}
                    </span>
                  </div>
                  {rule.reason && (
                    <p className="text-sm text-gray-600">{rule.reason}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(rule.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => deleteRule.mutate(rule.id)}
                className="btn-danger p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <IPRuleModal linkId={linkId} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function IPRuleModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    ip_address: '',
    rule_type: 'blacklist' as 'blacklist' | 'whitelist',
    reason: '',
  })

  const addRule = useMutation({
    mutationFn: (data: any) => securityApi.addIPRule(linkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-rules'] })
      toast.success('IP rule added successfully')
      onClose()
    },
    onError: () => {
      toast.error('Failed to add IP rule')
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add IP Rule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form 
          onSubmit={(e) => { 
            e.preventDefault() 
            addRule.mutate(formData)
          }} 
          className="space-y-5"
        >
          <div>
            <label className="label">IP Address *</label>
            <input
              type="text"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              className="input"
              placeholder="192.168.1.100 or 192.168.1.0/24"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a single IP address or a range in CIDR notation
            </p>
          </div>

          <div>
            <label className="label">Rule Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rule_type: 'blacklist' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.rule_type === 'blacklist'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="font-semibold">Blacklist</p>
                <p className="text-xs text-gray-600 mt-1">Block this IP</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rule_type: 'whitelist' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.rule_type === 'whitelist'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">Whitelist</p>
                <p className="text-xs text-gray-600 mt-1">Allow only this IP</p>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="Why are you adding this rule?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={addRule.isPending} 
              className="btn-primary flex-1"
            >
              {addRule.isPending ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== Other Sections ====================
function GeoRestrictionsSection({ linkId: _linkId }: { linkId: string }) {
  return (
    <div className="card text-center py-20">
      <div className="inline-flex rounded-full bg-green-100 p-6 mb-6">
        <Globe className="h-16 w-16 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Geographic Restrictions</h3>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Control access based on visitor location. Block or allow specific countries, 
        regions, or cities. Redirect blocked users to alternative pages.
      </p>
      <button className="btn-primary inline-flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Configure Geo Rules
      </button>
    </div>
  )
}

function RateLimitsSection({ linkId: _linkId }: { linkId: string }) {
  return (
    <div className="card text-center py-20">
      <div className="inline-flex rounded-full bg-yellow-100 p-6 mb-6">
        <Zap className="h-16 w-16 text-yellow-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Rate Limiting</h3>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Prevent abuse and DDoS attacks by limiting the number of requests from 
        a single IP address within a specified time window.
      </p>
      <button className="btn-primary inline-flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Setup Rate Limits
      </button>
    </div>
  )
}

function SmartRedirectsSection({ linkId: _linkId }: { linkId: string }) {
  return (
    <div className="card text-center py-20">
      <div className="inline-flex rounded-full bg-purple-100 p-6 mb-6">
        <ArrowRight className="h-16 w-16 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Redirects</h3>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Redirect visitors to different URLs based on device type, location, browser, 
        time of day, or custom conditions. Perfect for A/B testing and personalization.
      </p>
      <div className="flex justify-center gap-4 mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Smartphone className="h-4 w-4" />
          Device
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="h-4 w-4" />
          Location
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          Time
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="h-4 w-4" />
          Custom
        </div>
      </div>
      <button className="btn-primary inline-flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Redirect Rules
      </button>
    </div>
  )
}
