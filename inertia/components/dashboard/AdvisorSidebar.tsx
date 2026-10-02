import { usePage } from '@inertiajs/react'
import React, { useState } from 'react'
import { useEmployees } from '../../hooks/use_employees'
import AppLink from '../ui/AppLink'
import Input from '../ui/Input'
import NavLink from '../ui/NavLink'

interface AdvisorSidebarProps {
  /** Selected employee id to highlight. From route /dashboard/conseiller/employees/:id */
  selectedEmployeeId?: string | null
  showSuperAdminLinks?: boolean
  activePdfJobsCount?: number
}

const sidebarShellClass = 'lg:col-span-1 flex flex-col min-h-0 lg:max-h-[calc(100vh-15.5rem)]'

function SuperAdminSidebarContent() {
  return (
    <aside className={sidebarShellClass}>
      <div className="bg-white rounded-[24px] border border-brand-navy/5 p-3 flex flex-col flex-1 min-h-0 lg:sticky lg:top-24 shadow-sm">
        <nav className="flex flex-col flex-1 min-h-0 space-y-0.5">
          <div className="px-3 py-2 mb-2">
            <h3 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
              Supervision
            </h3>
          </div>
          <NavLink href="/dashboard/super-admin" icon="dashboard" label="Supervision Plateforme" />
          <NavLink
            href="/dashboard/super-admin/organizations"
            icon="building"
            label="Organisations"
          />
          <NavLink href="/dashboard/super-admin/users" icon="user" label="Utilisateurs" />
          <NavLink
            href="/dashboard/super-admin/expert-requests"
            icon="users"
            label="Demandes d'accompagnement"
          />
          <NavLink href="/dashboard/super-admin/team" icon="user" label="Équipe interne" />
          <NavLink href="/dashboard/super-admin/b2c" icon="users" label="Particuliers" />
          <NavLink href="/dashboard/super-admin/payments" icon="target" label="Paiements" />
          <NavLink
            href="/dashboard/super-admin/exercises-usage"
            icon="target"
            label="Usage exercices"
          />
          <NavLink href="/dashboard/super-admin/design-system" icon="palette" label="Design" />
          <NavLink href="/dashboard/super-admin/pdf-exports" icon="settings" label="Exports PDF" />
        </nav>
      </div>
    </aside>
  )
}

function AdvisorSidebarContent({
  selectedEmployeeId = null,
  activePdfJobsCount = 0,
}: {
  selectedEmployeeId?: string | null
  activePdfJobsCount?: number
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const { url } = usePage()
  const { filteredEmployees, loading: employeesLoading } = useEmployees(searchTerm)

  return (
    <aside className={sidebarShellClass}>
      <div className="bg-white rounded-[24px] border border-brand-navy/5 p-3 flex flex-col flex-1 min-h-0 lg:sticky lg:top-24 shadow-sm">
        <nav className="flex flex-col flex-1 min-h-0 space-y-0.5">
          <div className="px-3 py-2 mb-2">
            <h3 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
              Navigation
            </h3>
          </div>
          <NavLink href="/dashboard/conseiller" icon="dashboard" label="Bureau" />
          <NavLink href="/dashboard/conseiller/employees" icon="users" label="Candidats" />
          <NavLink href="/dashboard/conseiller/settings" icon="settings" label="Réglages" />
          <NavLink
            href="/dashboard/conseiller/pdf-exports"
            icon="pdf"
            label="PDF Générés"
            badgeCount={activePdfJobsCount}
          />

          <div className="pt-4 mt-4 border-t border-brand-navy/5 flex flex-col flex-1 min-h-0">
            <div className="px-3 py-2 shrink-0">
              <h4 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                Candidats
              </h4>
            </div>
            <div className="px-2 mb-3 shrink-0">
              <Input
                placeholder="Filtrer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sizeVariant="sm"
              />
            </div>
            <div className="space-y-0.5 flex-1 min-h-0 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-brand-navy/5">
              {employeesLoading ? (
                <div className="py-6 text-center">
                  <div className="w-4 h-4 border-2 border-brand-sage/10 border-t-brand-sage rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Chargement
                  </span>
                </div>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const isActive =
                    selectedEmployeeId !== null &&
                    Number(selectedEmployeeId) === emp.id &&
                    url.includes('/dashboard/conseiller/employees/')
                  return (
                    <AppLink
                      key={emp.id}
                      href={`/dashboard/conseiller/employees/${emp.id}`}
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
                    </AppLink>
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
  )
}

export const AdvisorSidebar: React.FC<AdvisorSidebarProps> = ({
  selectedEmployeeId = null,
  showSuperAdminLinks = false,
  activePdfJobsCount = 0,
}) => {
  if (showSuperAdminLinks) {
    return <SuperAdminSidebarContent />
  }
  return (
    <AdvisorSidebarContent
      selectedEmployeeId={selectedEmployeeId}
      activePdfJobsCount={activePdfJobsCount}
    />
  )
}
