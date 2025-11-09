import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { linksApi, tagsApi, qrcodeApi } from '@/lib/api'
import { 
  Plus, Search, Copy, QrCode, BarChart3, Edit, Trash2, 
  ExternalLink, Tag as TagIcon, X, Download
} from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatRelativeTime, copyToClipboard, getShortURL } from '@/lib/utils'

export default function LinksPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  const { data: linksData, isLoading } = useQuery({
    queryKey: ['links', search],
    queryFn: () => linksApi.getAll({ search, limit: 50 }),
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

  const links = linksData?.data?.data || []
  const tags = tagsData?.data?.data || []

  const filteredLinks = selectedTags.length > 0
    ? links.filter((link: any) =>
        link.tags?.some((tag: any) => selectedTags.includes(tag.id))
      )
    : links

  const handleCopy = async (address: string, domain?: string) => {
    await copyToClipboard(getShortURL(address, domain))
    toast.success('Copied to clipboard!')
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
      <div className="mb-6 flex flex-wrap gap-4 animate-slideInUp">
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
        <div className="grid gap-4 animate-slideInUp">
          {filteredLinks.map((link: any) => (
            <LinkCard
              key={link.id}
              link={link}
              onCopy={handleCopy}
              onDelete={(id) => deleteLink.mutate(id)}
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

      {/* QR Code Modal */}
      {showQRModal && (
        <QRCodeModal linkId={showQRModal} onClose={() => setShowQRModal(null)} />
      )}
    </div>
  )
}

function LinkCard({ link, onCopy, onDelete, onShowQR }: any) {
  return (
    <div className="card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 group animate-scaleIn">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg truncate">/{link.address}</h3>
            {link.banned && (
              <span className="badge bg-red-100 text-red-800">Banned</span>
            )}
          </div>
          <a
            href={link.target}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 truncate"
          >
            {link.target}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
          {link.description && (
            <p className="text-sm text-gray-500 mt-2">{link.description}</p>
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
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onCopy(link.address, link.domain)}
            className="btn-secondary p-2 hover:scale-110 transition-transform duration-200"
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onShowQR(link.uuid)}
            className="btn-secondary p-2"
            title="Generate QR code"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <RouterLink
            to={`/app/links/${link.uuid}/stats`}
            className="btn-secondary p-2"
            title="View stats"
          >
            <BarChart3 className="h-4 w-4" />
          </RouterLink>
          <button
            onClick={() => onDelete(link.uuid)}
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
  const [formData, setFormData] = useState({
    target: '',
    customurl: '',
    description: '',
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

function QRCodeModal({ linkId, onClose }: { linkId: string; onClose: () => void }) {
  const [format, setFormat] = useState<'png' | 'svg' | 'dataurl'>('png')
  const [size, setSize] = useState(300)
  const [qrData, setQRData] = useState<string | null>(null)

  const generateQR = useMutation({
    mutationFn: () => qrcodeApi.generate(linkId, { format, size }),
    onSuccess: (response) => {
      if (format === 'dataurl') {
        setQRData(response.data.qrcode)
      } else {
        const url = URL.createObjectURL(response.data)
        setQRData(url)
      }
    },
  })

  const handleDownload = () => {
    if (!qrData) return
    const a = document.createElement('a')
    a.href = qrData
    a.download = `qr-${linkId}.${format === 'svg' ? 'svg' : 'png'}`
    a.click()
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
