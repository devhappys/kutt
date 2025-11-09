import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const resetPassword = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      setIsSubmitted(true)
      toast.success('Password reset email sent!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset email')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resetPassword.mutate({ email })
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="card text-center animate-fadeIn">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h1>
            
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <p className="text-sm text-blue-800">
                📧 Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  try again
                </button>
              </p>
            </div>

            <Link to="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="card animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="btn-primary w-full"
            >
              {resetPassword.isPending ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
