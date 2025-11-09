import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { linksApi } from '@/lib/api'
import { Link2, QrCode, BarChart3, Shield, Tag, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [shortLink, setShortLink] = useState('')

  const createLink = useMutation({
    mutationFn: (data: { target: string; customurl?: string }) =>
      linksApi.create(data),
    onSuccess: (response) => {
      const link = response.data
      setShortLink(`${window.location.origin}/${link.address}`)
      toast.success('Short link created!')
      setUrl('')
      setCustomUrl('')
    },
    onError: () => {
      toast.error('Failed to create link')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    createLink.mutate({
      target: url,
      ...(customUrl && { customurl: customUrl }),
    })
  }

  const features = [
    {
      icon: Link2,
      title: 'URL Shortening',
      description: 'Create short, memorable links that are easy to share',
    },
    {
      icon: QrCode,
      title: 'QR Codes',
      description: 'Generate QR codes in multiple formats with custom styling',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track visits, UTM parameters, devices, and conversion funnels',
    },
    {
      icon: Tag,
      title: 'Tag System',
      description: 'Organize your links with custom tags and colors',
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'IP rules, geo-restrictions, and rate limiting',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 animate-gradient bg-300">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-primary-600">Hapxs SUrl</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
            <Link to="/app" className="btn-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center animate-fadeIn">
        <h2 className="mb-6 text-5xl font-bold text-gray-900 animate-slideInUp">
          Modern URL Shortener
        </h2>
        <p className="mb-12 text-xl text-gray-600">
          Create short links with advanced analytics, security features, and smart redirects
        </p>

        {/* URL Shortener Form */}
        <div className="card mx-auto max-w-2xl hover:shadow-glow transition-all duration-300 animate-scaleIn">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your long URL"
                className="input text-lg"
                required
              />
            </div>
            <div>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Custom short URL (optional)"
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={createLink.isPending}
              className="btn-primary w-full text-lg hover:scale-105 transform transition-all duration-200"
            >
              {createLink.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner" />
                  Creating...
                </span>
              ) : (
                'Shorten URL'
              )}
            </button>
          </form>

          {shortLink && (
            <div className="mt-6 rounded-lg bg-green-50 p-4 animate-slideInUp border-2 border-green-200">
              <p className="mb-2 text-sm font-medium text-green-800">
                Your short link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shortLink}
                  readOnly
                  className="input flex-1"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shortLink)
                    toast.success('Copied!')
                  }}
                  className="btn-primary"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-6 py-20 animate-fadeIn">
        <h3 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Powerful Features
        </h3>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className="card hover:shadow-glow transition-all duration-300 hover:-translate-y-2 animate-slideInUp"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary-100 p-3 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">
                {feature.title}
              </h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 py-20 text-white bg-200 animate-gradient relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="mb-6 text-4xl font-bold">
            Ready to get started?
          </h3>
          <p className="mb-8 text-xl text-primary-100">
            Create an account and start shortening URLs today
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-lg font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-gray-600">
          <p>© 2025 Hapxs SUrl. </p>
        </div>
      </footer>
    </div>
  )
}
