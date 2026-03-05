import React, { useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import Layout from '../layout/Layout'
import NavLink from '../ui/NavLink'
import Input from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { useEmployees } from '../../hooks/useEmployees'
import { isAdvisorOrAdmin, isSuperAdmin } from '../../helpers/roles'

interface DashboardLayoutProps {
  children: React.ReactNode
  /** For advisor: selected employee id to highlight in sidebar. From route /dashboard/employees/:id */
  selectedEmployeeId?: string | null
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, selectedEmployeeId = null }) => {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const { url } = usePage()
  const { employees, filteredEmployees, loading: employeesLoading } = useEmployees(searchTerm)

  if (!user) {
    return null
  }

  const userRole = user.role || 'employee'
  const isAdvisor = isAdvisorOrAdmin(userRole)
  const superAdmin = isSuperAdmin(userRole)

  return (
    <Layout userRole={userRole} onRoleChange={() => {}} onLogout={logout} userName={user.name}>
      {isAdvisor ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-[24px] border border-brand-navy/5 p-3 sticky top-24 shadow-sm">
              <nav className="space-y-0.5">
                <div className="px-3 py-2 mb-2">
                  <h3 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                    Navigation
                  </h3>
                </div>
                <NavLink href="/dashboard" icon="dashboard" label="Bureau" />
                <NavLink href="/dashboard/employees" icon="users" label="Candidats" />
                <NavLink href="/dashboard/settings" icon="settings" label="Réglages" />
                <NavLink href="/dashboard/design-system" icon="palette" label="Design" />
                {superAdmin && (
                  <>
                    <div className="px-3 pt-4 mt-4 pb-2 border-t border-brand-navy/5">
                      <h4 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                        Supervision
                      </h4>
                    </div>
                    <NavLink href="/dashboard/super-admin" icon="dashboard" label="Supervision Plateforme" />
                    <NavLink href="/dashboard/super-admin/organizations" icon="building" label="Organisations" />
                  </>
                )}

                <div className="pt-4 mt-4 border-t border-brand-navy/5">
                  <div className="px-3 py-2">
                    <h4 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                      Candidats
                    </h4>
                  </div>
                  <div className="px-2 mb-3">
                    <Input
                      placeholder="Filtrer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sizeVariant="sm"
                    />
                  </div>
                  <div className="space-y-0.5 max-h-[350px] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-brand-navy/5">
                    {employeesLoading ? (
                      <div className="py-6 text-center">
                        <div className="w-4 h-4 border-2 border-brand-sage/10 border-t-brand-sage rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest">
                          Chargement
                        </span>
                      </div>
                    ) : filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const isActive = selectedEmployeeId !== null && Number(selectedEmployeeId) === emp.id && url.includes('/dashboard/employees/')
                        return (
                          <Link
                            key={emp.id}
                            href={`/dashboard/employees/${emp.id}`}
                            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all group ${
                              isActive
                                ? 'bg-brand-sage/10 text-brand-sage'
                                : 'text-brand-navy/60 hover:bg-brand-ivory'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                                !emp.onboarded ? 'bg-brand-terracotta' : 'bg-brand-sage'
                              }`}
                            />
                            <span className="text-[11px] font-medium truncate">{emp.name}</span>
                          </Link>
                        )
                      })
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <p className="text-[9px] font-bold text-brand-navy/20 uppercase tracking-widest">
                          Aucun résultat
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </aside>
          <div className="lg:col-span-3">{children}</div>
        </div>
      ) : (
        <>{children}</>
      )}
    </Layout>
  )
}

export default DashboardLayout
