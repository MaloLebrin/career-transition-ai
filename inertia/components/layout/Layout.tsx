import React from 'react'
import Button from '../ui/Button'
import FlashBanner from './FlashBanner'
import Logo from '../ui/Logo'

interface LayoutProps {
  children: React.ReactNode
  userRole: 'advisor' | 'employee' | 'admin' | 'super_admin'
  onRoleChange: (role: 'advisor' | 'employee') => void
  onLogout: () => void
  userName?: string
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, userName }) => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory">
      <header className="bg-white border-b border-brand-navy/5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
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
                  {userRole === 'advisor' && 'Expert Accompagnateur'}
                  {(userRole === 'admin' || userRole === 'super_admin') && 'Administrateur'}
                  {userRole === 'employee' && 'Candidat Transition'}
                  {!['advisor', 'admin', 'super_admin', 'employee'].includes(userRole) &&
                    'Utilisateur'}
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
              onClick={onLogout}
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
      <main className="grow max-w-7xl mx-auto px-6 py-10 w-full">{children}</main>
      <footer className="bg-white border-t border-brand-navy/5 p-8 text-center">
        <div className="text-[10px] font-bold text-brand-navy/20 uppercase tracking-[0.2em]">
          France Transition Carrière &copy; 2026 • Clarté Stratégique Humaine
        </div>
      </footer>
    </div>
  )
}

export default Layout
