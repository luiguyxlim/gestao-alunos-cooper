'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileNavigation from './MobileNavigation'
import LogoutButton from './LogoutButton'

interface ResponsiveNavigationProps {
  user?: {
    user_metadata?: {
      full_name?: string
    }
    email?: string
  } | null
}

export default function ResponsiveNavigation({ user }: ResponsiveNavigationProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Avaliandos', href: '/evaluatees' },
    { name: 'Testes', href: '/tests' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                Cooper Pro
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop user menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <span className="text-sm text-gray-700">
              Olá, {user?.user_metadata?.full_name || user?.email || 'Usuário'}
            </span>
            <LogoutButton />
          </div>

          {/* Mobile menu button */}
          <MobileNavigation user={user} />
        </div>
      </div>
    </nav>
  )
}