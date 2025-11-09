import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagsApi } from '@/lib/api'
import { Plus, Edit, Trash2, X, Tag as TagIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const COLOR_PRESETS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#06b6d4', '#a855f7',
]

export default function TagsPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  })

  const deleteTag = useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag deleted')
    },
  })

  const tags = tagsData?.data?.data || []

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="mt-2 text-gray-600">
            Organize your links with custom tags
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Tag
        </button>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : tags.length === 0 ? (
        <div className="card text-center py-20">
          <TagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No tags yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your First Tag
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slideInUp">
          {tags.map((tag: any, idx: number) => (
            <div 
              key={tag.id} 
              className="card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 group animate-scaleIn"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: tag.color + '20' }}
                  >
                    <TagIcon
                      className="h-6 w-6"
                      style={{ color: tag.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{tag.name}</h3>
                    <p className="text-sm text-gray-500">
                      {tag.usage_count || 0} links
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="btn-secondary p-2 hover:scale-110 transition-transform duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTag.mutate(tag.id)}
                    className="btn-danger p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                className="mt-4 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTag) && (
        <TagModal
          tag={editingTag}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTag(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingTag(null)
            queryClient.invalidateQueries({ queryKey: ['tags'] })
          }}
        />
      )}
    </div>
  )
}

function TagModal({ tag, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    color: tag?.color || COLOR_PRESETS[0],
  })

  const createTag = useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      toast.success('Tag created!')
      onSuccess()
    },
  })

  const updateTag = useMutation({
    mutationFn: (data: any) => tagsApi.update(tag.id, data),
    onSuccess: () => {
      toast.success('Tag updated!')
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tag) {
      updateTag.mutate(formData)
    } else {
      createTag.mutate(formData)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {tag ? 'Edit Tag' : 'Create Tag'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Tag Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Marketing"
              required
            />
          </div>

          <div>
            <label className="label">Color *</label>
            <div className="grid grid-cols-6 gap-3 mb-3">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-10 w-full rounded-lg transition-transform hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-12 rounded-lg cursor-pointer"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="label">Preview</label>
            <div
              className="badge text-lg px-4 py-2"
              style={{
                backgroundColor: formData.color + '20',
                color: formData.color,
              }}
            >
              {formData.name || 'Tag Name'}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTag.isPending || updateTag.isPending}
              className="btn-primary flex-1"
            >
              {tag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
