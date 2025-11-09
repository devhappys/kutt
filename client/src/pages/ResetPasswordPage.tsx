import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const resetPassword = useMutation({
    mutationFn: (data: { password: string; reset_password_token: string }) =>
      authApi.newPassword(data),
    onSuccess: () => {
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login'), 2000)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    resetPassword.mutate({
      password: formData.password,
      reset_password_token: token,
    })
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h1>
            
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>

            <Link to="/forgot-password" className="btn-primary w-full">
              Request New Link
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
              <Lock className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pr-12"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input pr-12"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Tips */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 mb-2">Password Tips</p>
                  <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                    <li>Use at least 8 characters</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Add numbers and special characters</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="btn-primary w-full"
            >
              {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Link not working?{' '}
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
