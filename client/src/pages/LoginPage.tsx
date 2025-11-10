import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Link2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import PasskeyLogin from '@/components/PasskeyLogin'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { user, apikey } = response.data
      setAuth(user, apikey)
      toast.success('Login successful!')
      navigate('/app')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed')
    },
  })

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (response) => {
      const { user, apikey } = response.data
      setAuth(user, apikey)
      toast.success('Account created successfully!')
      navigate('/app')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Signup failed')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      loginMutation.mutate(formData)
    } else {
      signupMutation.mutate(formData)
    }
  }

  const isPending = loginMutation.isPending || signupMutation.isPending

  const handlePasskeySuccess = (_token: string, apikey: string) => {
    // First set the API key for subsequent requests
    localStorage.setItem('apiKey', apikey)
    
    // Fetch user data with the API key
    authApi.getUser()
      .then((response) => {
        const userData = response.data?.data || response.data
        setAuth(userData, apikey)
        toast.success('Signed in with passkey!')
        navigate('/app')
      })
      .catch((error) => {
        console.error('Failed to fetch user data:', error)
        toast.error('Failed to fetch user data')
      })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 px-6 py-12 animate-gradient bg-300">
      <div className="w-full max-w-md animate-scaleIn">
        {/* Logo */}
        <div className="mb-8 text-center animate-slideInUp">
          <div className="mb-4 inline-flex items-center gap-2">
            <Link2 className="h-10 w-10 text-primary-600" />
            <h1 className="text-3xl font-bold text-primary-600">Hapxs SUrl</h1>
          </div>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card hover:shadow-glow transition-all duration-300">
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1 relative">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${isLogin
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${!isLogin
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full hover:scale-105 transform transition-all duration-200"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : isLogin ? (
                'Login'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Passkey Login - Only show in login mode */}
          {isLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Or continue with</span>
                </div>
              </div>

              <PasskeyLogin
                email={formData.email}
                onSuccess={handlePasskeySuccess}
              />
            </>
          )}

          {/* Alternative Actions */}
          <div className="mt-6 text-center">
            {isLogin && (
              <p className="text-sm text-gray-600">
                Forgot your password?{' '}
                <Link 
                  to="/reset-password" 
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Reset it
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
