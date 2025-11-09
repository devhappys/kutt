import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { User, Key, Copy, Eye, EyeOff, Save, Mail, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'security'>('profile')

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User, desc: 'Personal information' },
    { key: 'api', label: 'API Key', icon: Key, desc: 'API authentication' },
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

  const handleRegenerate = () => {
    toast.success('API Key regeneration coming soon!')
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
    mutationFn: async (data: any) => {
      // Placeholder for password change
      await new Promise(resolve => setTimeout(resolve, 1000))
      return data
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: () => {
      toast.error('Failed to change password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    changePassword.mutate(formData)
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
    </div>
  )
}
