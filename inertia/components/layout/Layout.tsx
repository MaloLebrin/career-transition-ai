import { USERS_ROLES, type UserRole } from '#shared/constants/user'
import React, { useState } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Logo from '../ui/Logo'
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
    void Promise.resolve(onLogout()).then(() => setShowLogoutModal(false))
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory">
      <header className="bg-white border-b border-brand-navy/5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl 2xl:max-w-(--width-app-container) mx-auto px-6 h-20 flex justify-between items-center">
          <button
            type="button"
            className="flex items-center space-x-3 cursor-pointer border-none bg-transparent p-0"
            onClick={() => window.location.reload()}
          >
            <Logo size="md" showText={false} />
            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight text-brand-navy leading-none">
                France Transition Carrière
              </h1>
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mt-1">
                Accompagnement Expert
              </p>
            </div>
          </button>

          <div className="flex items-center space-x-2 md:space-x-6">
            <div className="hidden sm:flex items-center space-x-4 mr-2">
              <div className="text-right">
                <div className="text-xs font-bold text-brand-navy leading-none">
                  {userName || 'Utilisateur'}
                </div>
                <div className="text-[9px] font-bold text-brand-sage uppercase tracking-widest mt-1">
                  {userRole === USERS_ROLES.ADVISOR && 'Expert Accompagnateur'}
                  {(userRole === USERS_ROLES.ADMIN || userRole === USERS_ROLES.SUPER_ADMIN) &&
                    'Administrateur'}
                  {userRole === USERS_ROLES.EMPLOYEE && 'Candidat Transition'}
                  {!Object.values(USERS_ROLES).includes(userRole as any) && 'Utilisateur'}
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-brand-ivory border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'Felix'}`}
                  alt="avatar"
                />
              </div>
            </div>

            <Button
              onClick={() => setShowLogoutModal(true)}
              variant="outline"
              size="sm"
              className="group border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
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
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <Card className="w-full max-w-md p-8 animate-slideUp">
            <h2 id="logout-modal-title" className="text-xl font-bold text-brand-navy mb-2">
              Déconnexion
            </h2>
            <p className="text-brand-navy/60 text-sm mb-8">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowLogoutModal(false)}
              >
                Annuler
              </Button>
              <Button variant="danger" size="md" onClick={handleLogoutConfirm}>
                Se déconnecter
              </Button>
            </div>
          </Card>
        </div>
      )}
      <main className="grow flex flex-col max-w-7xl 2xl:max-w-[var(--width-app-container)] mx-auto px-6 py-10 w-full min-h-0">{children}</main>
      <footer className="bg-white border-t border-brand-navy/5 p-8 text-center">
        <div className="text-[10px] font-bold text-brand-navy/20 uppercase tracking-[0.2em]">
          France Transition Carrière &copy; 2026 • Clarté Stratégique Humaine
        </div>
      </footer>
    </div>
  )
}

export default Layout
