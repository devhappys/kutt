import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { linksApi, tagsApi, qrcodeApi } from '@/lib/api'
import { 
  Plus, Search, Copy, QrCode, BarChart3, Trash2, 
  ExternalLink, X, Download, Edit, Lock, Calendar, RefreshCw
} from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatRelativeTime, copyToClipboard, getShortURL } from '@/lib/utils'

export default function LinksPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'created' | 'visits' | 'name'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data: linksData, isLoading } = useQuery({
    queryKey: ['links', search],
    queryFn: () => linksApi.getAll({ search, limit: 100 }),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  })

  const deleteLink = useMutation({
    mutationFn: linksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      toast.success('Link deleted')
    },
  })

  const batchDelete = useMutation({
    mutationFn: async (linkIds: string[]) => {
      await Promise.all(linkIds.map(id => linksApi.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setSelectedLinks(new Set())
      toast.success('Links deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete some links')
    }
  })

  const links = linksData?.data?.data || []
  const tags = tagsData?.data?.data || []

  // Filter by tags
  let filteredLinks = selectedTags.length > 0
    ? links.filter((link: any) =>
        link.tags?.some((tag: any) => selectedTags.includes(tag.id))
      )
    : links

  // Sort links
  filteredLinks = [...filteredLinks].sort((a: any, b: any) => {
    let aVal, bVal
    switch (sortBy) {
      case 'visits':
        aVal = a.visit_count || 0
        bVal = b.visit_count || 0
        break
      case 'name':
        aVal = a.address.toLowerCase()
        bVal = b.address.toLowerCase()
        break
      case 'created':
      default:
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
    }
    
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleCopy = async (address: string, domain?: string) => {
    await copyToClipboard(getShortURL(address, domain))
    toast.success('Copied to clipboard!')
  }

  const handleSelectAll = () => {
    if (selectedLinks.size === filteredLinks.length) {
      setSelectedLinks(new Set())
    } else {
      setSelectedLinks(new Set(filteredLinks.map((l: any) => l.id)))
    }
  }

  const handleSelectLink = (linkId: string) => {
    const newSet = new Set(selectedLinks)
    if (newSet.has(linkId)) {
      newSet.delete(linkId)
    } else {
      newSet.add(linkId)
    }
    setSelectedLinks(newSet)
  }

  const handleBatchDelete = () => {
    if (selectedLinks.size === 0) return
    if (confirm(`Delete ${selectedLinks.size} link(s)?`)) {
      batchDelete.mutate(Array.from(selectedLinks))
    }
  }

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Links</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Link
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4 animate-slideInUp">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links..."
              className="input pl-10"
            />
          </div>
          
          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input pr-8"
            >
              <option value="created">Created Date</option>
              <option value="visits">Visits</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary p-2"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: any) => (
            <button
              key={tag.id}
              onClick={() =>
                setSelectedTags((prev) =>
                  prev.includes(tag.id)
                    ? prev.filter((id) => id !== tag.id)
                    : [...prev, tag.id]
                )
              }
              className={`badge cursor-pointer transition-all ${
                selectedTags.includes(tag.id)
                  ? 'ring-2 ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: tag.color + '20',
                color: tag.color,
                ...(selectedTags.includes(tag.id) && { ringColor: tag.color }),
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>

        {/* Batch Actions Toolbar */}
        {selectedLinks.size > 0 && (
          <div className="card bg-primary-50 border-primary-200 flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-primary-900">
                {selectedLinks.size} link{selectedLinks.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedLinks(new Set())}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBatchDelete}
                disabled={batchDelete.isPending}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {batchDelete.isPending ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Links Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-gray-500">No links found</p>
        </div>
      ) : (
        <div className="space-y-4 animate-slideInUp">
          {/* Select All */}
          {filteredLinks.length > 0 && (
            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                checked={selectedLinks.size === filteredLinks.length && filteredLinks.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label className="text-sm text-gray-600">
                Select all ({filteredLinks.length})
              </label>
            </div>
          )}
          
          {filteredLinks.map((link: any) => (
            <LinkCard
              key={link.id}
              link={link}
              selected={selectedLinks.has(link.id)}
              onSelect={handleSelectLink}
              onCopy={handleCopy}
              onEdit={setEditingLink}
              onDelete={(id: string) => deleteLink.mutate(id)}
              onShowQR={setShowQRModal}
            />
          ))}
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <CreateLinkModal
          tags={tags}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['links'] })
          }}
        />
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          tags={tags}
          onClose={() => setEditingLink(null)}
          onSuccess={() => {
            setEditingLink(null)
            queryClient.invalidateQueries({ queryKey: ['links'] })
          }}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <QRCodeModal linkId={showQRModal} onClose={() => setShowQRModal(null)} />
      )}
    </div>
  )
}

function LinkCard({ link, selected, onSelect, onCopy, onDelete, onShowQR, onEdit }: any) {
  return (
    <div className={`card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 group animate-scaleIn overflow-hidden ${
      selected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
    }`}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Checkbox */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(link.id)}
            className="mt-1 h-4 w-4 text-primary-600 rounded flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <h3 className="font-semibold text-lg break-all">/{link.address}</h3>
            {link.password && (
              <span className="badge bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Protected
              </span>
            )}
            {link.expire_in && (
              <span className="badge bg-purple-100 text-purple-800 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expires
              </span>
            )}
            {link.banned && (
              <span className="badge bg-red-100 text-red-800">Banned</span>
            )}
          </div>
          <a
            href={link.target}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 max-w-full"
          >
            <span className="truncate flex-1 min-w-0">{link.target}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
          {link.description && (
            <p className="text-sm text-gray-500 mt-2 break-words">{link.description}</p>
          )}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {link.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  className="badge"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 sm:ml-4 flex-shrink-0">
          <button
            onClick={() => onCopy(link.address, link.domain)}
            className="btn-secondary p-2 hover:scale-110 transition-transform duration-200"
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(link)}
            className="btn-secondary p-2"
            title="Edit link"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onShowQR(link.id)}
            className="btn-secondary p-2"
            title="Generate QR code"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <RouterLink
            to={`/app/links/${link.id}/stats`}
            className="btn-secondary p-2"
            title="View stats"
          >
            <BarChart3 className="h-4 w-4" />
          </RouterLink>
          <button
            onClick={() => onDelete(link.id)}
            className="btn-danger p-2"
            title="Delete link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>{link.visit_count} visits</span>
        <span>{formatRelativeTime(link.created_at)}</span>
      </div>
    </div>
  )
}

function CreateLinkModal({ tags, onClose, onSuccess }: any) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    target: '',
    customurl: '',
    description: '',
    password: '',
    expire_in: '',
    reuse: false,
    tag_ids: [] as number[],
  })

  const createLink = useMutation({
    mutationFn: linksApi.create,
    onSuccess: () => {
      toast.success('Link created!')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to create link')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createLink.mutate(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Link</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Destination URL *</label>
            <input
              type="url"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="input"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label className="label">Custom URL (optional)</label>
            <input
              type="text"
              value={formData.customurl}
              onChange={(e) => setFormData({ ...formData, customurl: e.target.value })}
              className="input"
              placeholder="my-custom-url"
            />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <>
              <div>
                <label className="label">Password Protection (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="Add password to protect link"
                />
              </div>

              <div>
                <label className="label">Expiration Date (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expire_in}
                  onChange={(e) => setFormData({ ...formData, expire_in: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reuse"
                  checked={formData.reuse}
                  onChange={(e) => setFormData({ ...formData, reuse: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="reuse" className="text-sm text-gray-700 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Reuse existing link if target already exists
                </label>
              </div>
            </>
          )}

          <div>
            <label className="label">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: any) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      tag_ids: prev.tag_ids.includes(tag.id)
                        ? prev.tag_ids.filter((id) => id !== tag.id)
                        : [...prev.tag_ids, tag.id],
                    }))
                  }
                  className={`badge cursor-pointer ${
                    formData.tag_ids.includes(tag.id) ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLink.isPending}
              className="btn-primary flex-1"
            >
              {createLink.isPending ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditLinkModal({ link, tags, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    address: link.address || '',
    target: link.target || '',
    description: link.description || '',
    expire_in: link.expire_in || '',
    password: '',
    removePassword: false,
    tag_ids: link.tags?.map((t: any) => t.id) || [] as number[],
  })
  const [showPasswordField, setShowPasswordField] = useState(false)

  const updateLink = useMutation({
    mutationFn: (data: any) => linksApi.update(link.id, data),
    onSuccess: () => {
      toast.success('Link updated!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update link')
    },
  })

  const updateTags = useMutation({
    mutationFn: async (tag_ids: number[]) => {
      const currentIds = link.tags?.map((t: any) => t.id) || []
      const toAdd = tag_ids.filter(id => !currentIds.includes(id))
      const toRemove = currentIds.filter((id: number) => !tag_ids.includes(id))
      
      if (toAdd.length > 0) {
        await tagsApi.addToLink(link.id, toAdd)
      }
      if (toRemove.length > 0) {
        await tagsApi.removeFromLink(link.id, toRemove)
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Update basic fields
      const updateData: any = {}
      
      if (formData.address !== link.address) updateData.address = formData.address
      if (formData.target !== link.target) updateData.target = formData.target
      if (formData.description !== link.description) updateData.description = formData.description
      if (formData.expire_in !== link.expire_in) updateData.expire_in = formData.expire_in
      
      // Handle password
      if (formData.removePassword) {
        updateData.password = null
      } else if (formData.password) {
        updateData.password = formData.password
      }
      
      const hasBasicChanges = Object.keys(updateData).length > 0
      const hasTagChanges = JSON.stringify(formData.tag_ids.sort()) !== 
                           JSON.stringify((link.tags?.map((t: any) => t.id) || []).sort())
      
      if (!hasBasicChanges && !hasTagChanges) {
        toast.error('No changes to update')
        return
      }
      
      // Update link fields
      if (hasBasicChanges) {
        await updateLink.mutateAsync(updateData)
      }
      
      // Update tags
      if (hasTagChanges) {
        await updateTags.mutateAsync(formData.tag_ids)
      }
      
      if (!hasBasicChanges && hasTagChanges) {
        toast.success('Tags updated!')
      }
      
      onSuccess()
    } catch (error) {
      // Error already handled by mutation
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Link</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Short URL</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              placeholder="custom-url"
            />
            <p className="text-xs text-gray-500 mt-1">
              Change the short URL path
            </p>
          </div>

          <div>
            <label className="label">Destination URL *</label>
            <input
              type="url"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="input"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          <div>
            <label className="label">Expiration Date (optional)</label>
            <input
              type="datetime-local"
              value={formData.expire_in}
              onChange={(e) => setFormData({ ...formData, expire_in: e.target.value })}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to remove expiration
            </p>
          </div>

          {/* Password Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">
                Password Protection
                {link.password && (
                  <span className="ml-2 badge bg-yellow-100 text-yellow-800 text-xs">
                    <Lock className="h-3 w-3 inline mr-1" />
                    Currently Protected
                  </span>
                )}
              </label>
              {!showPasswordField && (
                <button
                  type="button"
                  onClick={() => setShowPasswordField(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {link.password ? 'Change Password' : 'Add Password'}
                </button>
              )}
            </div>

            {showPasswordField && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value, removePassword: false })}
                  className="input"
                  placeholder={link.password ? "Enter new password" : "Enter password"}
                />
                
                {link.password && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="removePassword"
                      checked={formData.removePassword}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        removePassword: e.target.checked,
                        password: e.target.checked ? '' : formData.password
                      })}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <label htmlFor="removePassword" className="text-sm text-gray-700">
                      Remove password protection
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordField(false)
                    setFormData({ ...formData, password: '', removePassword: false })
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Tags Management */}
          <div>
            <label className="label">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {tags && tags.length > 0 ? (
                tags.map((tag: any) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tag_ids: prev.tag_ids.includes(tag.id)
                          ? prev.tag_ids.filter((id: number) => id !== tag.id)
                          : [...prev.tag_ids, tag.id],
                      }))
                    }
                    className={`badge cursor-pointer transition-all ${
                      formData.tag_ids.includes(tag.id) ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      ...(formData.tag_ids.includes(tag.id) && { ringColor: tag.color }),
                    }}
                  >
                    {tag.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tags available. Create tags first.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLink.isPending || updateTags.isPending}
              className="btn-primary flex-1"
            >
              {updateLink.isPending || updateTags.isPending ? 'Updating...' : 'Update Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function QRCodeModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const [format, setFormat] = useState<'png' | 'svg' | 'dataurl'>('png')
  const [size, setSize] = useState(300)
  const [qrData, setQRData] = useState<string | null>(null)

  // Clean up blob URL when format changes or component unmounts
  useEffect(() => {
    return () => {
      if (qrData && qrData.startsWith('blob:')) {
        URL.revokeObjectURL(qrData)
      }
    }
  }, [qrData])

  // Reset QR data when format or size changes
  useEffect(() => {
    setQRData(null)
  }, [format, size])

  const generateQR = useMutation({
    mutationFn: () => qrcodeApi.generate(linkId, { format, size }),
    onSuccess: (response) => {
      if (format === 'dataurl') {
        // For dataurl format, response.data is JSON with qrcode property
        setQRData(response.data?.qrcode || response.data)
      } else {
        // For png/svg, response.data is a Blob
        const blob = response.data
        const url = URL.createObjectURL(blob)
        setQRData(url)
      }
      toast.success('QR Code generated!')
    },
    onError: () => {
      toast.error('Failed to generate QR Code')
    },
  })

  const handleDownload = () => {
    if (!qrData) return
    const a = document.createElement('a')
    a.href = qrData
    
    // Set proper file extension based on format
    let extension = 'png'
    if (format === 'svg') extension = 'svg'
    else if (format === 'dataurl') extension = 'png'
    
    a.download = `qr-${linkId}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    toast.success('QR Code downloaded!')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Generate QR Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Format</label>
            <div className="flex gap-2">
              {(['png', 'svg', 'dataurl'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`btn-secondary flex-1 ${
                    format === f ? 'ring-2 ring-primary-600' : ''
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Size: {size}px</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={() => generateQR.mutate()}
            disabled={generateQR.isPending}
            className="btn-primary w-full"
          >
            {generateQR.isPending ? 'Generating...' : 'Generate QR Code'}
          </button>

          {qrData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrData} alt="QR Code" className="max-w-full" />
              </div>
              <button
                onClick={handleDownload}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
