import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, domainsApi, linksApi } from '@/lib/api'
import { 
  Users, Globe, Link as LinkIcon, Shield, Trash2, Ban, Plus, Search,
  X, Mail, Lock, CheckCircle, AlertTriangle, BarChart3, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'domains' | 'links'>('users')

  const tabs = [
    { key: 'users', label: 'Users', icon: Users, desc: 'Manage users' },
    { key: 'domains', label: 'Domains', icon: Globe, desc: 'Manage domains' },
    { key: 'links', label: 'Links', icon: LinkIcon, desc: 'Manage all links' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary-600" />
          Admin Panel
        </h1>
        <p className="mt-2 text-gray-600">
          Manage users, domains, and system settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 border-b-2 pb-4 px-2 transition-colors ${
              activeTab === tab.key
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
        {activeTab === 'users' && <UsersSection />}
        {activeTab === 'domains' && <DomainsSection />}
        {activeTab === 'links' && <LinksSection />}
      </div>
    </div>
  )
}

function UsersSection() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => usersApi.getAdmin({ limit: 50 }),
  })

  const banUser = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      usersApi.banUser(id, { banned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User status updated')
    },
  })

  const deleteUser = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User deleted')
    },
  })

  const users = data?.data?.data || []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input pl-10"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          User #{user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.banned ? (
                      <span className="badge bg-red-100 text-red-800">Banned</span>
                    ) : user.verified ? (
                      <span className="badge bg-green-100 text-green-800">Verified</span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-800">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{user.role || 'user'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="btn-secondary p-2"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => banUser.mutate({ id: user.id, banned: !user.banned })}
                      className={`${
                        user.banned ? 'btn-secondary' : 'btn-danger'
                      } p-2`}
                      title={user.banned ? 'Unban' : 'Ban'}
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this user?')) {
                          deleteUser.mutate(user.id)
                        }
                      }}
                      className="btn-danger p-2"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} />
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const createUser = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User created successfully!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createUser.mutate(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder="••••••••"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="btn-primary flex-1"
            >
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UserDetailsModal({ user, onClose }: { user: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="mt-1 text-gray-900 font-mono">#{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="mt-1 text-gray-900 capitalize">{user.role || 'user'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                {user.banned ? (
                  <span className="badge bg-red-100 text-red-800">Banned</span>
                ) : user.verified ? (
                  <span className="badge bg-green-100 text-green-800">Verified</span>
                ) : (
                  <span className="badge bg-yellow-100 text-yellow-800">Pending</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="mt-1 text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-gray-900">
                {new Date(user.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          {user.links_count !== undefined && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Links</p>
                  <p className="text-2xl font-bold text-gray-900">{user.links_count || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Domains</p>
                  <p className="text-2xl font-bold text-gray-900">{user.domains?.length || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Account Age</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 flex gap-3">
            <button onClick={onClose} className="btn-primary flex-1">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DomainsSection() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-domains'],
    queryFn: () => domainsApi.getAdmin({ limit: 50 }),
  })

  const deleteDomain = useMutation({
    mutationFn: domainsApi.removeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domains'] })
      toast.success('Domain deleted')
    },
  })

  const domains = data?.data?.data || []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Domains</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Domain
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : domains.length === 0 ? (
        <div className="card text-center py-12">
          <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No custom domains</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain: any) => (
            <div
              key={domain.id}
              className="card flex items-center justify-between hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary-100 p-3">
                  <Globe className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{domain.address}</p>
                  <p className="text-sm text-gray-600">
                    {domain.links_count || 0} links • User #{domain.user_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Delete this domain?')) {
                    deleteDomain.mutate(domain.id)
                  }
                }}
                className="btn-danger p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddDomainAdminModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

function AddDomainAdminModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    address: '',
    user_id: '',
  })

  const addDomain = useMutation({
    mutationFn: domainsApi.addAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domains'] })
      toast.success('Domain added successfully!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add domain')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = { address: formData.address }
    if (formData.user_id) {
      data.user_id = parseInt(formData.user_id)
    }
    addDomain.mutate(data)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Domain</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Domain Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              placeholder="short.example.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter domain without http:// or https://
            </p>
          </div>

          <div>
            <label className="label">User ID (optional)</label>
            <input
              type="number"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="input"
              placeholder="Leave empty for system domain"
            />
            <p className="mt-1 text-xs text-gray-500">
              Assign domain to a specific user
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">⚙️ DNS Configuration</p>
            <p className="text-sm text-yellow-700">
              After adding the domain, configure DNS A record to point to your server IP
            </p>
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

function LinksSection() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-links', search, page],
    queryFn: () => linksApi.getAll({ search, limit: 20, skip: (page - 1) * 20 }),
  })

  const links = data?.data?.data || []
  const total = data?.data?.total || 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Total: <strong>{total}</strong> links
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : links.length === 0 ? (
        <div className="card text-center py-12">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No links found</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {links.map((link: any) => (
              <div
                key={link.id}
                className="card hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate">/{link.address}</h3>
                      {link.password && (
                        <span className="badge bg-yellow-100 text-yellow-800">Protected</span>
                      )}
                      {link.banned && (
                        <span className="badge bg-red-100 text-red-800">Banned</span>
                      )}
                    </div>
                    <a
                      href={link.target}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-primary-600 truncate block"
                    >
                      {link.target}
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {link.visit_count} visits
                      </span>
                      <span>User #{link.user_id}</span>
                      <span>{new Date(link.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="btn-secondary p-2"
                      title="View stats"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this link?')) {
                          toast.success('Link deletion coming soon')
                        }
                      }}
                      className="btn-danger p-2"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="btn-secondary px-4 py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
