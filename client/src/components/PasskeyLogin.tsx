import { useState } from 'react'
import { authApi } from '@/lib/api'
import { startAuthentication } from '@simplewebauthn/browser'
import { Fingerprint, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

interface PasskeyLoginProps {
  email: string
  onSuccess: (token: string, apiKey: string) => void
}

export default function PasskeyLogin({ email, onSuccess }: PasskeyLoginProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handlePasskeyLogin = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Passkeys are not supported in this browser')
      return
    }

    setIsAuthenticating(true)

    try {
      // Step 1: Get authentication options from server
      const initRes = await authApi.passkey.authenticateInit({ email })
      const options = initRes.data

      // Step 2: Prompt user to authenticate
      const credential = await startAuthentication(options)

      // Step 3: Verify credential with server
      const verifyRes = await authApi.passkey.authenticateVerify({
        email,
        credential,
      })

      // Handle both direct data and nested data structure
      const responseData = verifyRes.data?.data || verifyRes.data
      const { token, apikey } = responseData

      if (!token || !apikey) {
        throw new Error('Invalid authentication response')
      }

      toast.success('Signed in successfully with passkey!')
      onSuccess(token, apikey)
    } catch (error: any) {
      console.error('Passkey authentication error:', error)

      if (error.name === 'NotAllowedError') {
        toast.error('Passkey authentication was cancelled')
      } else if (error.name === 'InvalidStateError') {
        toast.error('No matching passkey found on this device')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Passkeys are not supported on this device')
      } else if (error.name === 'AbortError') {
        toast.error('Passkey authentication timed out')
      } else if (error.name === 'NetworkError') {
        toast.error('Network error. Please check your connection')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.message) {
        toast.error(`Authentication failed: ${error.message}`)
      } else {
        toast.error('Failed to authenticate with passkey')
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <button
      onClick={handlePasskeyLogin}
      disabled={isAuthenticating || !email}
      className="w-full btn-secondary flex items-center justify-center gap-2"
    >
      {isAuthenticating ? (
        <>
          <Loader className="h-5 w-5 animate-spin" />
          Authenticating...
        </>
      ) : (
        <>
          <Fingerprint className="h-5 w-5" />
          Sign in with Passkey
        </>
      )}
    </button>
  )
}
