import { APP_NAME } from '#shared/constants/app'
import { type UserRole } from '#shared/constants/user'
import React, { useState } from 'react'
import { NotificationBell } from '~/components/notifications/NotificationBell'
import { Avatar } from '~/components/layout/header/Avatar'
import { LogoutModal } from '~/components/ui/LogoutModal'
import Button from '../ui/Button'
import { Logo } from '../ui/Logo'
import FlashBanner from './FlashBanner'

interface LayoutProps {
  children: React.ReactNode
  userRole: UserRole
  onRoleChange: (role: UserRole) => void
  onLogout: () => void | Promise<void>
  userName?: string
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, userName }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogoutConfirm = () => {
    // Ferme la modale avant d'appeler l'API pour éviter des états transitoires
    // (et potentiels problèmes d'hydratation) pendant la navigation logout.
    setShowLogoutModal(false)
    void Promise.resolve(onLogout()).catch(() => {})
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="bg-surface border-b border-hairline sticky top-0 z-50 shadow-card">
        <div className="max-w-7xl 2xl:max-w-(--width-app-container) mx-auto px-6 h-20 flex justify-between items-center">
          <button
            type="button"
            className="flex items-center space-x-3 cursor-pointer border-none bg-transparent p-0"
            onClick={() => window.location.reload()}
          >
            <Logo size="md" showText={false} />
            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight text-ink leading-none">{APP_NAME}</h1>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                Accompagnement Expert
              </p>
            </div>
          </button>

          <div className="flex items-center space-x-2 md:space-x-6">
            <Avatar userName={userName} userRole={userRole} />
            <NotificationBell />

            <Button
              onClick={() => setShowLogoutModal(true)}
              variant="outline"
              size="sm"
              className="group border-danger/20 text-danger hover:bg-danger-soft hover:border-danger/40"
              title="Déconnexion"
              icon={
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[1.5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              }
            >
              <span className="hidden md:inline">Quitter</span>
            </Button>
          </div>
        </div>
      </header>
      <FlashBanner />
      {showLogoutModal && (
        <LogoutModal onClose={() => setShowLogoutModal(false)} onLogout={handleLogoutConfirm} />
      )}
      <main className="grow flex flex-col max-w-7xl 2xl:max-w-(--width-app-container) mx-auto px-6 py-10 w-full min-h-0">
        {children}
      </main>
      <footer className="bg-surface border-t border-hairline p-8 text-center">
        <div className="text-[10px] font-bold text-muted-soft uppercase tracking-[0.2em]">
          {APP_NAME} &copy; 2026
        </div>
      </footer>
    </div>
  )
}

export default Layout
