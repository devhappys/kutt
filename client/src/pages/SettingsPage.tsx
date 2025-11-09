import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, domainsApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { User, Key, Copy, Eye, EyeOff, Save, Mail, Shield, Globe, Lock, Trash2, AlertTriangle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'domains' | 'security'>('profile')

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User, desc: 'Personal information' },
    { key: 'api', label: 'API Key', icon: Key, desc: 'API authentication' },
    { key: 'domains', label: 'Domains', icon: Globe, desc: 'Custom domains' },
    { key: 'security', label: 'Security', icon: Shield, desc: 'Account security' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 border-b-2 pb-4 px-2 transition-colors ${activeTab === tab.key
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            <tab.icon className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">{tab.label}</p>
              <p className="text-xs text-gray-500">{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'api' && <APIKeySection />}
        {activeTab === 'domains' && <DomainsSection />}
        {activeTab === 'security' && <SecuritySection />}
      </div>
    </div>
  )
}

function ProfileSection() {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    email: user?.email || '',
  })

  const updateUser = useMutation({
    mutationFn: authApi.updateUser,
    onSuccess: () => {
      toast.success('Profile updated successfully')
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser.mutate(formData)
  }

  return (
    <div className="max-w-2xl">
      <div className="card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <p className="text-sm text-gray-600">Update your account details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="you@example.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              This email is used for login and notifications
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Account Status</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your account is active and in good standing
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateUser.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function APIKeySection() {
  const { apiKey } = useAuthStore()
  const [showKey, setShowKey] = useState(false)

  const handleCopy = async () => {
    if (apiKey) {
      await copyToClipboard(apiKey)
      toast.success('API Key copied to clipboard!')
    }
  }

  const generateApiKey = useMutation({
    mutationFn: authApi.generateApiKey,
    onSuccess: (response) => {
      const newApiKey = response.data.apikey
      useAuthStore.getState().setAuth(useAuthStore.getState().user!, newApiKey)
      toast.success('API Key regenerated successfully!')
    },
    onError: () => {
      toast.error('Failed to regenerate API key')
    },
  })

  const handleRegenerate = () => {
    if (confirm('Are you sure you want to regenerate your API key? Your old key will stop working.')) {
      generateApiKey.mutate()
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-600" />
            API Key Management
          </h2>
          <p className="mt-2 text-gray-600">
            Use this API key to authenticate your requests to the Hapxs SUrl API
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label">Your API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey || 'No API key available'}
                  readOnly
                  className="input pr-12 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Include this key in the <code className="px-1 py-0.5 bg-gray-100 rounded">X-API-KEY</code> header
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Security Warning</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Keep your API key secure. Do not share it publicly or commit it to version control.
                  Anyone with your API key can access your account.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Usage</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600 mb-1">Base URL</p>
                <p className="text-sm font-mono font-medium text-gray-900">
                  /api/v2
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600 mb-1">Rate Limit</p>
                <p className="text-sm font-medium text-gray-900">
                  100 req/min
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Example Usage</h3>
            <div className="rounded-lg bg-gray-900 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100">
                {`curl -X GET "https://your-domain.com/api/v2/links" \\
  -H "X-API-KEY: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleRegenerate}
              className="btn-danger flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Regenerate Key
            </button>
            <p className="text-sm text-gray-600 flex items-center">
              This will invalidate your current key
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySection() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const changePassword = useMutation({
    mutationFn: (data: { currentpassword: string; newpassword: string }) => 
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    changePassword.mutate({
      currentpassword: formData.currentPassword,
      newpassword: formData.newPassword
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Security Settings
          </h2>
          <p className="mt-2 text-gray-600">
            Manage your password and security preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="input"
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="input"
              placeholder="Enter new password"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input"
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="rounded-lg bg-green-50 p-4 border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Password Strength Tips</p>
                <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Use at least 8 characters</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Add numbers and special characters</li>
                  <li>Avoid common words or patterns</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </button>
            <button type="button" className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication (Future) */}
      <div className="card mt-6 opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <button className="btn-secondary" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <DeleteAccountSection />
    </div>
  )
}

function DeleteAccountSection() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')

  const deleteAccount = useMutation({
    mutationFn: (data: { password: string }) => usersApi.deleteAccount(data),
    onSuccess: () => {
      toast.success('Account deleted successfully')
      logout()
      navigate('/login')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    },
  })

  const handleDelete = () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    deleteAccount.mutate({ password })
  }

  return (
    <>
      <div className="card mt-6 border-2 border-red-200">
        <div className="flex items-start gap-4">
          <div className="rounded-xl p-3 bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Danger Zone</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Once you delete your account, there is no going back. All your links, stats, and settings will be permanently removed.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Account</h2>
              <p className="text-gray-600">
                This action cannot be undone. Please enter your password to confirm.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>All your shortened links</li>
                  <li>All statistics and analytics data</li>
                  <li>Custom domains and settings</li>
                  <li>API keys and integrations</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteAccount.isPending}
                  className="btn-danger flex-1"
                >
                  {deleteAccount.isPending ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DomainsSection() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [showAddModal, setShowAddModal] = useState(false)

  // Refresh user data to get latest domains
  useQuery({
    queryKey: ['user-domains'],
    queryFn: () => authApi.getUser(),
  })

  const domains = user?.domains || []

  const deleteDomain = useMutation({
    mutationFn: domainsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-domains'] })
      toast.success('Domain deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete domain')
    },
  })

  return (
    <div className="max-w-4xl">
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary-600" />
              Custom Domains
            </h2>
            <p className="mt-2 text-gray-600">
              Add your own domain to create branded short links
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Domain
          </button>
        </div>

        {domains.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Domains</h3>
            <p className="text-gray-600 mb-6">
              Add your own domain to create professional branded short links
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2 inline" />
              Add Your First Domain
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain: any) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-100 p-2">
                    <Globe className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{domain.address}</p>
                    <p className="text-sm text-gray-500">
                      {domain.links_count || 0} links
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteDomain.mutate(domain.id)}
                  className="btn-danger p-2"
                  title="Delete domain"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">DNS Configuration Required</p>
              <p className="text-sm text-blue-700">
                After adding a domain, you'll need to configure DNS records to point to our servers.
                Instructions will be provided after adding your domain.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddDomainModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

function AddDomainModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    address: '',
    homepage: '',
  })

  const addDomain = useMutation({
    mutationFn: domainsApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-domains'] })
      toast.success('Domain added successfully!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add domain')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addDomain.mutate(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Custom Domain</h2>
          <p className="text-gray-600">
            Enter your domain name to use for short links
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Domain Name *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              placeholder="short.yourdomain.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter your domain without http:// or https://
            </p>
          </div>

          <div>
            <label className="label">Homepage URL (Optional)</label>
            <input
              type="url"
              value={formData.homepage}
              onChange={(e) => setFormData({ ...formData, homepage: e.target.value })}
              className="input"
              placeholder="https://yourdomain.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Where to redirect when someone visits your domain root
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">📝 Next Steps</p>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Add your domain here</li>
              <li>Configure DNS A record to point to our server</li>
              <li>Wait for DNS propagation (up to 48 hours)</li>
              <li>Start creating links with your custom domain</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={addDomain.isPending}
              className="btn-primary flex-1"
            >
              {addDomain.isPending ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
