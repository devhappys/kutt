import { Outlet, NavLink } from 'react-router-dom'
import {
  Home,
  Link as LinkIcon,
  Tag,
  Settings,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', to: '/app', icon: Home, end: true },
    { name: 'Links', to: '/app/links', icon: LinkIcon },
    { name: 'Tags', to: '/app/tags', icon: Tag },
    { name: 'Settings', to: '/app/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-primary-600">Hapxs SUrl</h1>
            <p className="text-sm text-gray-500">URL Shortener</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
