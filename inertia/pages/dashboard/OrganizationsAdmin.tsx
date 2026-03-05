import React from 'react'
import { Head } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { isSuperAdmin } from '../../helpers/roles'

interface OrganizationItem {
  id: number
  name: string
  slug: string
  usersCount: number
  employeesCount: number
  createdAt: string | null
}

interface OrganizationsAdminProps {
  organizations: OrganizationItem[]
}

export default function OrganizationsAdmin({ organizations }: OrganizationsAdminProps) {
  const { user } = useAuth()
  const role = user?.role || 'employee'

  if (!isSuperAdmin(role)) {
    return (
      <>
        <Head title="Accès restreint" />
        <DashboardLayout>
          <div className="max-w-xl mx-auto text-center py-24 space-y-4">
            <h1 className="text-3xl font-bold text-brand-navy">Accès réservé</h1>
            <p className="text-brand-navy/60 text-sm font-medium">
              Cette section est réservée aux administrateurs de la plateforme France Transition Carrière.
            </p>
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head title="Organisations" />
      <DashboardLayout>
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
                Vue Super Admin
              </p>
              <h1 className="text-3xl font-bold text-brand-navy tracking-tight">Organisations clientes</h1>
              <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
                Liste des cabinets utilisant le portail, avec le volume de collaborateurs et de talents suivis.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
              <thead className="bg-brand-ivory/60">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Cabinet
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Utilisateurs
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Talents
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Créée le
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-brand-ivory/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-brand-navy/60">#{org.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-navy">{org.name}</span>
                        <span className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-widest">
                          {org.slug}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-navy/70">{org.usersCount}</td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-navy/70">{org.employeesCount}</td>
                    <td className="px-6 py-4 text-xs text-brand-navy/40">
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={5}
                    >
                      Aucune organisation enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

