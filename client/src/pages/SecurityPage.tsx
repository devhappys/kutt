import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { securityApi } from '@/lib/api'
import { 
  Shield, Plus, Trash2, X, Globe, Zap, ArrowRight, 
  ArrowLeft, AlertTriangle, CheckCircle,
  Smartphone, Clock
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
  const [editingRule, setEditingRule] = useState<any>(null)

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

      {editingRule && (
        <EditIPRuleModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
        />
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

function EditIPRuleModal({ rule, onClose }: { rule: any; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    ip_address: rule.ip_address || rule.ip_range || '',
    rule_type: rule.rule_type as 'blacklist' | 'whitelist',
    reason: rule.reason || '',
    is_active: rule.is_active !== false,
  })

  const updateRule = useMutation({
    mutationFn: (data: any) => securityApi.updateIPRule(rule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-rules'] })
      toast.success('IP rule updated successfully')
      onClose()
    },
    onError: () => {
      toast.error('Failed to update IP rule')
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit IP Rule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form 
          onSubmit={(e) => { 
            e.preventDefault() 
            const updateData: any = {}
            if (formData.ip_address !== (rule.ip_address || rule.ip_range)) {
              updateData.ip_address = formData.ip_address
            }
            if (formData.rule_type !== rule.rule_type) {
              updateData.rule_type = formData.rule_type
            }
            if (formData.reason !== rule.reason) {
              updateData.reason = formData.reason
            }
            if (formData.is_active !== (rule.is_active !== false)) {
              updateData.is_active = formData.is_active
            }
            updateRule.mutate(updateData)
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
              placeholder="Why are you updating this rule?"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Rule is active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={updateRule.isPending} 
              className="btn-primary flex-1"
            >
              {updateRule.isPending ? 'Updating...' : 'Update Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== Geo Restrictions Section ====================
function GeoRestrictionsSection({ linkId }: { linkId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['geo-restrictions', linkId],
    queryFn: () => securityApi.getGeoRestrictions(linkId),
  })

  const deleteRestriction = useMutation({
    mutationFn: securityApi.deleteGeoRestriction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-restrictions'] })
      toast.success('Geo restriction deleted')
    },
  })

  const restrictions = data?.data?.data || []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Geographic Restrictions</h2>
          <p className="mt-1 text-gray-600">
            Control access based on visitor location
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Restriction
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : restrictions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex rounded-full bg-green-100 p-4 mb-4">
            <Globe className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Geo Restrictions</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create geographic restrictions to control access based on location
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2 inline" />
            Add First Restriction
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {restrictions.map((restriction: any) => (
            <div 
              key={restriction.id} 
              className="card flex items-center justify-between hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`rounded-xl p-3 ${
                  restriction.restriction_type === 'allow' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <Globe className={`h-6 w-6 ${
                    restriction.restriction_type === 'allow'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs font-semibold uppercase ${
                      restriction.restriction_type === 'allow'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restriction.restriction_type}
                    </span>
                    <span className="font-bold text-gray-900">
                      {restriction.country_code}
                      {restriction.region && ` / ${restriction.region}`}
                      {restriction.city && ` / ${restriction.city}`}
                    </span>
                  </div>
                  {restriction.redirect_url && (
                    <p className="text-sm text-gray-600">Redirect: {restriction.redirect_url}</p>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => deleteRestriction.mutate(restriction.id)}
                className="btn-danger p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <GeoRestrictionModal linkId={linkId} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function GeoRestrictionModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    country_code: '',
    region: '',
    city: '',
    restriction_type: 'block' as 'allow' | 'block',
    redirect_url: '',
  })

  const addRestriction = useMutation({
    mutationFn: (data: any) => securityApi.addGeoRestriction(linkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-restrictions'] })
      toast.success('Geo restriction added successfully')
      onClose()
    },
    onError: () => {
      toast.error('Failed to add geo restriction')
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Geo Restriction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form 
          onSubmit={(e) => { 
            e.preventDefault() 
            addRestriction.mutate(formData)
          }} 
          className="space-y-5"
        >
          <div>
            <label className="label">Country Code *</label>
            <input
              type="text"
              value={formData.country_code}
              onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
              className="input"
              placeholder="US, CN, UK, etc."
              required
              maxLength={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              Two-letter ISO country code
            </p>
          </div>

          <div>
            <label className="label">Region (Optional)</label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="input"
              placeholder="California, Beijing, etc."
            />
          </div>

          <div>
            <label className="label">City (Optional)</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input"
              placeholder="San Francisco, Shanghai, etc."
            />
          </div>

          <div>
            <label className="label">Restriction Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, restriction_type: 'block' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.restriction_type === 'block'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="font-semibold">Block</p>
                <p className="text-xs text-gray-600 mt-1">Deny access</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, restriction_type: 'allow' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.restriction_type === 'allow'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">Allow</p>
                <p className="text-xs text-gray-600 mt-1">Only this location</p>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Redirect URL (Optional)</label>
            <input
              type="url"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              className="input"
              placeholder="https://example.com/blocked"
            />
            <p className="mt-1 text-xs text-gray-500">
              Where to redirect blocked users
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={addRestriction.isPending} 
              className="btn-primary flex-1"
            >
              {addRestriction.isPending ? 'Adding...' : 'Add Restriction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RateLimitsSection({ linkId }: { linkId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['rate-limits', linkId],
    queryFn: () => securityApi.getRateLimits(linkId),
  })

  const deleteLimit = useMutation({
    mutationFn: securityApi.deleteRateLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limits'] })
      toast.success('Rate limit deleted')
    },
  })

  const limits = data?.data?.data || []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rate Limiting</h2>
          <p className="mt-1 text-gray-600">
            Prevent abuse by limiting request frequency
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rate Limit
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : limits.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex rounded-full bg-yellow-100 p-4 mb-4">
            <Zap className="h-12 w-12 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rate Limits</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Set up rate limiting to protect your links from abuse
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2 inline" />
            Setup Rate Limit
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {limits.map((limit: any) => (
            <div 
              key={limit.id} 
              className="card flex items-center justify-between hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="rounded-xl p-3 bg-yellow-100">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                
                <div className="flex-1">
                  <div className="mb-1">
                    <span className="font-bold text-gray-900 text-lg">
                      {limit.max_requests} requests
                    </span>
                    <span className="text-gray-600"> per </span>
                    <span className="font-bold text-gray-900">
                      {limit.window_seconds}s
                    </span>
                  </div>
                  {limit.block_duration_minutes && (
                    <p className="text-sm text-gray-600">
                      Block for {limit.block_duration_minutes} minutes after limit exceeded
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(limit.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => deleteLimit.mutate(limit.id)}
                className="btn-danger p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RateLimitModal linkId={linkId} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function RateLimitModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    max_requests: 100,
    window_seconds: 60,
    block_duration_minutes: '5',
  })

  const addLimit = useMutation({
    mutationFn: (data: any) => securityApi.addRateLimit(linkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limits'] })
      toast.success('Rate limit added successfully')
      onClose()
    },
    onError: () => {
      toast.error('Failed to add rate limit')
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Rate Limit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form 
          onSubmit={(e) => { 
            e.preventDefault() 
            addLimit.mutate(formData)
          }} 
          className="space-y-5"
        >
          <div>
            <label className="label">Maximum Requests *</label>
            <input
              type="number"
              value={formData.max_requests}
              onChange={(e) => setFormData({ ...formData, max_requests: parseInt(e.target.value) })}
              className="input"
              placeholder="100"
              required
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum number of requests allowed
            </p>
          </div>

          <div>
            <label className="label">Time Window (seconds) *</label>
            <input
              type="number"
              value={formData.window_seconds}
              onChange={(e) => setFormData({ ...formData, window_seconds: parseInt(e.target.value) })}
              className="input"
              placeholder="60"
              required
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Time period for the limit (e.g., 60 = per minute)
            </p>
          </div>

          <div>
            <label className="label">Block Duration (minutes, optional)</label>
            <input
              type="text"
              value={formData.block_duration_minutes}
              onChange={(e) => setFormData({ ...formData, block_duration_minutes: e.target.value })}
              className="input"
              placeholder="5"
            />
            <p className="mt-1 text-xs text-gray-500">
              How long to block after exceeding the limit
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">📊 Example</p>
            <p className="text-sm text-blue-700">
              {formData.max_requests} requests per {formData.window_seconds} seconds = 
              <strong> {Math.round(formData.max_requests / formData.window_seconds * 60)} requests/minute</strong>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={addLimit.isPending} 
              className="btn-primary flex-1"
            >
              {addLimit.isPending ? 'Adding...' : 'Add Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SmartRedirectsSection({ linkId }: { linkId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['redirect-rules', linkId],
    queryFn: () => securityApi.getRedirectRules(linkId),
  })

  const deleteRule = useMutation({
    mutationFn: securityApi.deleteRedirectRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirect-rules'] })
      toast.success('Redirect rule deleted')
    },
  })

  const rules = data?.data?.data || []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Redirects</h2>
          <p className="mt-1 text-gray-600">
            Create intelligent routing rules based on conditions
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
          <div className="inline-flex rounded-full bg-purple-100 p-4 mb-4">
            <ArrowRight className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Redirect Rules</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create smart redirects based on device, location, or time
          </p>
          <div className="flex justify-center gap-4 mb-6">
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
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2 inline" />
            Create First Rule
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
                <div className="rounded-xl p-3 bg-purple-100">
                  <ArrowRight className="h-6 w-6 text-purple-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-lg">
                      {rule.rule_name}
                    </span>
                    {!rule.is_active && (
                      <span className="badge bg-gray-100 text-gray-600">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    → {rule.redirect_url}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {rule.device_type && (
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {rule.device_type}
                      </span>
                    )}
                    {rule.country_code && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {rule.country_code}
                      </span>
                    )}
                    {(rule.time_start || rule.time_end) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled
                      </span>
                    )}
                  </div>
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
        <RedirectRuleModal linkId={linkId} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function RedirectRuleModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    rule_name: '',
    redirect_url: '',
    device_type: '',
    country_code: '',
    browser: '',
    priority: 0,
  })

  const addRule = useMutation({
    mutationFn: (data: any) => securityApi.addRedirectRule(linkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirect-rules'] })
      toast.success('Redirect rule added successfully')
      onClose()
    },
    onError: () => {
      toast.error('Failed to add redirect rule')
    },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Redirect Rule</h2>
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
            <label className="label">Rule Name *</label>
            <input
              type="text"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              className="input"
              placeholder="Mobile users to app page"
              required
            />
          </div>

          <div>
            <label className="label">Redirect URL *</label>
            <input
              type="url"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              className="input"
              placeholder="https://example.com/mobile"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Where to redirect when conditions match
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Device Type</label>
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="input"
              >
                <option value="">Any</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="desktop">Desktop</option>
              </select>
            </div>

            <div>
              <label className="label">Country Code</label>
              <input
                type="text"
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                className="input"
                placeholder="US, CN"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="label">Browser (Optional)</label>
            <select
              value={formData.browser}
              onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
              className="input"
            >
              <option value="">Any</option>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
              <option value="edge">Edge</option>
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="input"
              placeholder="0"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Higher priority rules are checked first
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm font-medium text-purple-900 mb-2">💡 Use Cases</p>
            <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
              <li>Redirect mobile users to app stores</li>
              <li>Show country-specific content</li>
              <li>A/B testing different landing pages</li>
              <li>Browser-specific optimizations</li>
            </ul>
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
