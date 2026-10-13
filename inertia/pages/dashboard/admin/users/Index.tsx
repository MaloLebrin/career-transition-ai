import {
  ROLE_DESCRIPTIONS,
  ROLE_FILTER_ALL_DESCRIPTION,
  SUPER_ADMIN_CREATABLE_ROLES,
} from '#shared/constants/roles'
import { ROLE_LABELS, isSuperAdmin } from '#shared/helpers/roles'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import type { PaginationMeta } from '#shared/types/pagination'
import type { UserListItem } from '#shared/types/super_admin/lists'
import { Head, router } from '@inertiajs/react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { UserEditRow } from '~/components/dashboard/admin/users/UserEditRow'
import { UserRowActions } from '~/components/dashboard/admin/users/UserRowActions'
import { CreateUserModal } from '~/components/modals/CreateUserModal'
import Badge from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'
import Input from '~/components/ui/Input'
import { Pagination } from '~/components/ui/Pagination'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'
import { useAuth } from '~/hooks/use_auth'
import { useServerList } from '~/hooks/use_server_list'

type UserItem = UserListItem

interface OrganizationOption {
  id: number
  name: string
  slug: string
}

interface UsersAdminProps {
  users: UserItem[]
  organizations: OrganizationOption[]
  pagination: PaginationMeta
  filters: { search: string; role: UserRole | 'all' }
}

const LIST_PATH = '/dashboard/super-admin/users'
const LIST_ONLY = ['users']

type PendingRoleChange = {
  userId: number
  userName: string
  currentRole: UserRole
  newRole: UserRole
}

export default function UsersAdmin({ users, organizations, pagination, filters }: UsersAdminProps) {
  const { user } = useAuth()
  const role = user?.role || 'employee'
  const { values, setSearch, setFilter, goToPage } = useServerList(
    LIST_PATH,
    { search: filters.search, role: filters.role },
    LIST_ONLY
  )
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null)
  const [roleSubmitting, setRoleSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [resendSubmittingId, setResendSubmittingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

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

  const roleFilterOptions = useMemo<SelectFieldOption<UserRole | 'all'>[]>(
    () => [
      {
        value: 'all',
        label: 'Tous les rôles',
        description: ROLE_FILTER_ALL_DESCRIPTION,
      },
      {
        value: USERS_ROLES.EMPLOYEE,
        label: ROLE_LABELS[USERS_ROLES.EMPLOYEE],
        description: ROLE_DESCRIPTIONS[USERS_ROLES.EMPLOYEE],
      },
      {
        value: USERS_ROLES.ADVISOR,
        label: ROLE_LABELS[USERS_ROLES.ADVISOR],
        description: ROLE_DESCRIPTIONS[USERS_ROLES.ADVISOR],
      },
      {
        value: USERS_ROLES.EXPERT,
        label: ROLE_LABELS[USERS_ROLES.EXPERT],
        description: ROLE_DESCRIPTIONS[USERS_ROLES.EXPERT],
      },
      {
        value: USERS_ROLES.ADMIN,
        label: ROLE_LABELS[USERS_ROLES.ADMIN],
        description: ROLE_DESCRIPTIONS[USERS_ROLES.ADMIN],
      },
      {
        value: USERS_ROLES.SUPER_ADMIN,
        label: ROLE_LABELS[USERS_ROLES.SUPER_ADMIN],
        description: ROLE_DESCRIPTIONS[USERS_ROLES.SUPER_ADMIN],
      },
    ],
    []
  )

  // Ni `super_admin` (#66) ni `employee` (#96) ne s'attribuent depuis l'interface (refusés côté serveur).
  const roleRowSelectOptions = useMemo<SelectFieldOption<UserRole>[]>(
    () =>
      SUPER_ADMIN_CREATABLE_ROLES.map((r) => ({
        value: r,
        label: ROLE_LABELS[r],
        description: ROLE_DESCRIPTIONS[r],
      })),
    []
  )

  const openConfirmChangeRole = (u: UserItem, newRole: UserRole) => {
    setPendingRoleChange({
      userId: u.id,
      userName: u.name,
      currentRole: u.role,
      newRole,
    })
  }

  const closeRoleConfirmModal = () => {
    if (roleSubmitting) return
    setPendingRoleChange(null)
  }

  const confirmRoleChange = () => {
    if (!pendingRoleChange || roleSubmitting) return
    const { userId, newRole } = pendingRoleChange
    setRoleSubmitting(true)
    router.post(
      `/dashboard/super-admin/users/${userId}/role`,
      { role: newRole },
      {
        preserveScroll: true,
        onFinish: () => {
          setRoleSubmitting(false)
          setPendingRoleChange(null)
        },
      }
    )
  }

  const handleRoleSelectChange = (u: UserItem, newRole: UserRole) => {
    if (newRole === u.role) return
    openConfirmChangeRole(u, newRole)
  }

  const handleResendOnboarding = (id: number) => {
    setResendSubmittingId(id)
    router.post(
      `/dashboard/super-admin/users/${id}/resend-onboarding`,
      {},
      {
        preserveScroll: true,
        onFinish: () => setResendSubmittingId(null),
      }
    )
  }

  useEffect(() => {
    if (!pendingRoleChange || roleSubmitting) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingRoleChange(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pendingRoleChange, roleSubmitting])

  return (
    <>
      <Head title="Utilisateurs" />
      <DashboardLayout>
        <div className="space-y-8 animate-fadeIn">
          <CreateUserModal
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            organizations={organizations}
          />

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
                Vue Super Admin
              </p>
              <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
                Utilisateurs de la plateforme
              </h1>
              <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
                Création de comptes, invitation par email, changement de rôle (confirmé) et renvoi
                de lien pour les comptes non activés.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:items-center md:justify-end">
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                Créer un utilisateur
              </Button>
              <Input
                value={values.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email, cabinet…"
              />
              <SelectField<UserRole | 'all'>
                aria-label="Filtrer par rôle"
                options={roleFilterOptions}
                value={values.role as UserRole | 'all'}
                onChange={(v) => setFilter('role', v)}
                showSelectedOptionDescription
                className="shrink-0 w-full sm:min-w-[200px] sm:max-w-[280px]"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
              <thead className="bg-brand-sage/5 border-b border-brand-sage/10">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Cabinet
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Accès
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {users.map((u) => (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-brand-ivory/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-navy">{u.name}</span>
                          <span className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-widest">
                            #{u.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/70">{u.email}</td>
                      <td className="px-6 py-4 text-xs text-brand-navy/70">
                        {u.organization ? u.organization.name : '—'}
                      </td>
                      <td className="px-6 py-4 align-top">
                        {u.role === USERS_ROLES.SUPER_ADMIN ? (
                          <span className="text-xs font-semibold text-brand-navy/70">
                            {ROLE_LABELS[u.role]}
                          </span>
                        ) : (
                          <SelectField<UserRole>
                            aria-label={`Changer le rôle de ${u.name}`}
                            options={roleRowSelectOptions}
                            value={u.role}
                            onChange={(newRole) => handleRoleSelectChange(u, newRole)}
                            showSelectedOptionDescription
                            className="w-full max-w-[240px]"
                            selectClassName="py-1.5 px-2 text-xs"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.disabledAt ? (
                          <Badge variant="danger">Désactivé</Badge>
                        ) : (
                          <Badge variant={u.onboardingCompleted ? 'success' : 'warning'}>
                            {u.onboardingCompleted ? 'Actif' : 'En attente'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-end gap-2">
                          {!u.onboardingCompleted && (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              className="text-[10px]"
                              disabled={resendSubmittingId === u.id}
                              isLoading={resendSubmittingId === u.id}
                              onClick={() => handleResendOnboarding(u.id)}
                            >
                              Renvoyer l’invitation
                            </Button>
                          )}
                          <UserRowActions
                            user={u}
                            currentUserId={user?.id ?? null}
                            onEdit={(target) => setEditingId(target.id)}
                          />
                        </div>
                      </td>
                    </tr>
                    {editingId === u.id && (
                      <UserEditRow user={u} colSpan={6} onClose={() => setEditingId(null)} />
                    )}
                  </Fragment>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={6}
                    >
                      Aucun utilisateur ne correspond à vos critères pour le moment.
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

          <ConfirmModal
            isOpen={pendingRoleChange !== null}
            variant="warning"
            title="Modifier le rôle ?"
            description={
              pendingRoleChange
                ? `Vous allez passer ${pendingRoleChange.userName} du rôle « ${ROLE_LABELS[pendingRoleChange.currentRole]} » au rôle « ${ROLE_LABELS[pendingRoleChange.newRole]} ». Cette action modifie immédiatement ses droits sur la plateforme.`
                : undefined
            }
            confirmLabel="Confirmer le changement"
            state={roleSubmitting ? 'loading' : 'idle'}
            onCancel={closeRoleConfirmModal}
            onConfirm={confirmRoleChange}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
