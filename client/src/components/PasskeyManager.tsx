import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { startRegistration } from '@simplewebauthn/browser'
import { Key, Trash2, Edit2, X, Plus, Shield, Clock, Fingerprint } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/lib/utils'

interface Passkey {
  id: string
  name: string
  created_at: string
  last_used?: string
  transports: string[]
}

export default function PasskeyManager() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Fetch passkeys
  const { data: passkeysData } = useQuery({
    queryKey: ['passkeys'],
    queryFn: async () => {
      const res = await authApi.passkey.list()
      return res.data?.data || res.data
    },
  })

  // Fetch passkey status
  const { data: statusData } = useQuery({
    queryKey: ['passkey-status'],
    queryFn: async () => {
      const res = await authApi.passkey.getStatus()
      return res.data?.data || res.data
    },
  })

  const passkeys: Passkey[] = passkeysData?.passkeys || []
  const isEnabled = statusData?.enabled || false
  const passkeyCount = statusData?.count || 0

  // Delete passkey mutation
  const deletePasskey = useMutation({
    mutationFn: async (id: string) => {
      await authApi.passkey.remove(id, { password: deletePassword })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passkeys'] })
      queryClient.invalidateQueries({ queryKey: ['passkey-status'] })
      toast.success('Passkey deleted successfully')
      setShowDeleteModal(null)
      setDeletePassword('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete passkey')
    },
  })

  // Rename passkey mutation
  const renamePasskey = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await authApi.passkey.rename(id, { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passkeys'] })
      toast.success('Passkey renamed successfully')
      setEditingId(null)
      setEditingName('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to rename passkey')
    },
  })

  const handleAddPasskey = () => {
    setShowAddModal(true)
  }

  const handleDeleteConfirm = () => {
    if (showDeleteModal && deletePassword) {
      deletePasskey.mutate(showDeleteModal)
    }
  }

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renamePasskey.mutate({ id, name: editingName })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary-600" />
            Passkeys
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Use biometric authentication or security keys to sign in
          </p>
        </div>
        <button
          onClick={handleAddPasskey}
          className="btn-primary flex items-center gap-2"
          disabled={!window.PublicKeyCredential}
        >
          <Plus className="h-4 w-4" />
          Add Passkey
        </button>
      </div>

      {/* Status Banner */}
      {!window.PublicKeyCredential && (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            <Shield className="h-4 w-4 inline mr-2" />
            Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn.
          </p>
        </div>
      )}

      {isEnabled && passkeyCount > 0 && (
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-800">
            <Shield className="h-4 w-4 inline mr-2" />
            Passkey authentication is enabled. You can use any of your registered passkeys to sign in.
          </p>
        </div>
      )}

      {/* Passkeys List */}
      {passkeys.length === 0 ? (
        <div className="card text-center py-12">
          <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No passkeys registered</p>
          <p className="text-sm text-gray-400 mt-2">
            Add a passkey to enable secure, passwordless authentication
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {passkeys.map((passkey) => (
            <div key={passkey.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Key className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    {editingId === passkey.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="input text-sm py-1"
                          placeholder="Passkey name"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(passkey.id)}
                          className="btn-primary py-1 px-3 text-sm"
                          disabled={renamePasskey.isPending}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditingName('')
                          }}
                          className="btn-secondary py-1 px-3 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium">{passkey.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {formatRelativeTime(passkey.created_at)}
                          </span>
                          {passkey.last_used && (
                            <span className="flex items-center gap-1">
                              Last used {formatRelativeTime(passkey.last_used)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId !== passkey.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(passkey.id)
                          setEditingName(passkey.name)
                        }}
                        className="btn-secondary p-2"
                        title="Rename passkey"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(passkey.id)}
                        className="btn-danger p-2"
                        title="Delete passkey"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Passkey Modal */}
      {showAddModal && (
        <AddPasskeyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ['passkeys'] })
            queryClient.invalidateQueries({ queryKey: ['passkey-status'] })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Delete Passkey</h2>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this passkey? This action cannot be undone.
            </p>

            <div className="mb-6">
              <label className="label">Confirm with your password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={!deletePassword || deletePasskey.isPending}
                className="btn-danger flex-1"
              >
                {deletePasskey.isPending ? 'Deleting...' : 'Delete Passkey'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddPasskeyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [passkeyName, setPasskeyName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async () => {
    if (!passkeyName.trim()) {
      toast.error('Please enter a name for your passkey')
      return
    }

    if (!window.PublicKeyCredential) {
      toast.error('Passkeys are not supported in this browser')
      return
    }

    setIsRegistering(true)

    try {
      // Step 1: Get registration options from server
      const initRes = await authApi.passkey.registerInit()
      const options = initRes.data?.data || initRes.data

      if (!options || typeof options !== 'object' || !options.challenge) {
        throw new Error('Invalid registration options received from server')
      }

      // Step 2: Prompt user to create credential
      const credential = await startRegistration({ optionsJSON: options })

      // Step 3: Verify credential with server
      await authApi.passkey.registerVerify({ credential, name: passkeyName.trim() })

      toast.success('Passkey registered successfully!')
      onSuccess()
    } catch (error: any) {
      // Log to console for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Passkey registration error:', error)
      }
      
      if (error.name === 'NotAllowedError') {
        toast.error('Passkey registration was cancelled')
      } else if (error.name === 'InvalidStateError') {
        toast.error('This passkey is already registered')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Passkeys are not supported on this device')
      } else if (error.name === 'AbortError') {
        toast.error('Passkey registration timed out')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.message) {
        toast.error(`Registration failed: ${error.message}`)
      } else {
        toast.error('Failed to register passkey')
      }
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Passkey</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Create a passkey to enable fast, secure sign-in using biometrics or your device's security key.
          </p>

          <label className="label">Passkey Name</label>
          <input
            type="text"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            className="input"
            placeholder="e.g., Windows Hello, iPhone, YubiKey"
            maxLength={50}
            autoFocus
            disabled={isRegistering}
          />
          <p className="text-xs text-gray-500 mt-1">
            Give your passkey a memorable name to identify it later
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={isRegistering}>
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={!passkeyName.trim() || isRegistering}
            className="btn-primary flex-1"
          >
            {isRegistering ? 'Registering...' : 'Create Passkey'}
          </button>
        </div>
      </div>
    </div>
  )
}
