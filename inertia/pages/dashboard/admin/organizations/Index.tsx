import { isSuperAdmin } from '#shared/helpers/roles'
import type { OrganizationListItem } from '#shared/types/super_admin/lists'
import type { PaginationMeta } from '#shared/types/pagination'
import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { CreateOrganizationModal } from '~/components/modals/CreateOrganizationModal'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'
import AppLink from '~/components/ui/AppLink'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { Pagination } from '~/components/ui/Pagination'
import { useAuth } from '~/hooks/use_auth'
import { useServerList } from '~/hooks/use_server_list'

interface OrganizationsAdminProps {
  organizations: OrganizationListItem[]
  pagination: PaginationMeta
  filters: { search: string; minEmployees: number | '' }
}

const LIST_PATH = '/dashboard/super-admin/organizations'
const LIST_ONLY = ['organizations']

export default function OrganizationsAdmin({
  organizations,
  pagination,
  filters,
}: OrganizationsAdminProps) {
  const { user } = useAuth()
  const role = user?.role || 'employee'
  const { values, setSearch, setFilter, goToPage } = useServerList(
    LIST_PATH,
    { search: filters.search, minEmployees: String(filters.minEmployees) },
    LIST_ONLY
  )
  const [createOpen, setCreateOpen] = useState(false)

  if (!isSuperAdmin(role)) {
    return (
      <>
        <Head title="Accès restreint" />
        <DashboardLayout>
          <div className="max-w-xl mx-auto text-center py-24 space-y-4">
            <h1 className="text-3xl font-bold text-brand-navy">Accès réservé</h1>
            <p className="text-brand-navy/60 text-sm font-medium">
              Cette section est réservée aux administrateurs de la plateforme Transition Carrière.
            </p>
          </div>
        </DashboardLayout>
      </>
    )
  }

  const handleDeleteOrganization = (id: number) => {
    if (
      !window.confirm(
        'Voulez-vous vraiment supprimer cette organisation ? Cette action est potentiellement irréversible.'
      )
    ) {
      return
    }
    router.delete(`/dashboard/super-admin/organizations/${id}`)
  }

  return (
    <>
      <Head title="Organisations" />
      <DashboardLayout>
        <div className="space-y-8 animate-fadeIn">
          <CreateOrganizationModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
                Vue Super Admin
              </p>
              <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
                Organisations clientes
              </h1>
              <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
                Liste des cabinets utilisant le portail, avec le volume de collaborateurs et de
                talents suivis.
              </p>
            </div>
            <div className="flex w-full md:w-auto md:justify-end">
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                Créer une organisation
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-3">
              <Input
                value={values.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, slug ou ID…"
              />
              <Input
                value={values.minEmployees}
                onChange={(e) => setFilter('minEmployees', e.target.value, true)}
                placeholder="Min talents"
                className="w-32"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
              <thead className="bg-brand-sage/5 border-b border-brand-sage/10">
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
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-brand-ivory/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-brand-navy/60">#{org.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <AppLink
                          href={SUPER_ADMIN_PATHS.organization(org.id)}
                          className="text-sm font-bold text-brand-navy underline-offset-4 hover:underline"
                        >
                          {org.name}
                        </AppLink>
                        <span className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-widest">
                          {org.slug}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-sage">
                      {org.usersCount}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-terracotta">
                      {org.employeesCount}
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-navy/40">
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          className="text-[11px]"
                          disabled={org.ownerId === null}
                          onClick={() =>
                            router.post('/auth/impersonate/' + org.ownerId, undefined, {
                              preserveScroll: true,
                            })
                          }
                        >
                          Impersonation
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          className="text-[11px]"
                          disabled={org.ownerId === null}
                          onClick={() =>
                            router.post('/auth/reset-password/' + org.ownerId, undefined, {
                              preserveScroll: true,
                            })
                          }
                        >
                          Envoyer un lien de réinitialisation
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          className="text-[11px] text-rose-600"
                          onClick={() => handleDeleteOrganization(org.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={5}
                    >
                      Aucune organisation ne correspond à vos critères pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            lastPage={pagination.lastPage}
            onPageChange={goToPage}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
