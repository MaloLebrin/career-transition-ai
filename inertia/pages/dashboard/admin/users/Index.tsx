import { isSuperAdmin, ROLE_LABELS } from '#shared/helpers/roles'
import { userRolesValues, USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'
import Input from '~/components/ui/Input'
import { useAuth } from '~/hooks/useAuth'

interface UserItem {
  id: number
  name: string
  email: string
  role: UserRole
  organization: { id: number; name: string } | null
  createdAt: string | null
}

interface UsersAdminProps {
  users: UserItem[]
}

type PendingRoleChange = {
  userId: number
  userName: string
  currentRole: UserRole
  newRole: UserRole
}

export default function UsersAdmin({ users }: UsersAdminProps) {
  const { user } = useAuth()
  const role = user?.role || 'employee'
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null)
  const [roleSubmitting, setRoleSubmitting] = useState(false)

  if (!isSuperAdmin(role)) {
    return (
      <>
        <Head title="Accès restreint" />
        <DashboardLayout>
          <div className="max-w-xl mx-auto text-center py-24 space-y-4">
            <h1 className="text-3xl font-bold text-brand-navy">Accès réservé</h1>
            <p className="text-brand-navy/60 text-sm font-medium">
              Cette section est réservée aux administrateurs de la plateforme France Transition
              Carrière.
            </p>
          </div>
        </DashboardLayout>
      </>
    )
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.organization?.name.toLowerCase().includes(term) ?? false)

      const matchesRole = roleFilter === 'all' || u.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

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
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
                Vue Super Admin
              </p>
              <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
                Utilisateurs de la plateforme
              </h1>
              <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
                Liste globale des comptes, avec leur rôle et leur cabinet associé. Chaque
                changement de rôle est confirmé avant envoi.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email, cabinet…"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="border border-brand-navy/10 rounded-xl text-xs px-3 py-2 text-brand-navy/80 bg-white"
              >
                <option value="all">Tous les rôles</option>
                <option value={USERS_ROLES.EMPLOYEE}>Employé</option>
                <option value={USERS_ROLES.ADVISOR}>Conseiller</option>
                <option value={USERS_ROLES.ADMIN}>Admin orga</option>
                <option value={USERS_ROLES.SUPER_ADMIN}>Super admin</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
              <thead className="bg-brand-ivory/60">
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
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-ivory/60 transition-colors">
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
                    <td className="px-6 py-4 text-xs text-brand-navy/80">{ROLE_LABELS[u.role]}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {userRolesValues.map((r) => (
                            <Button
                              key={r}
                              type="button"
                              size="xs"
                              variant={u.role === r ? 'primary' : 'outline'}
                              className="text-[10px]"
                              disabled={u.role === r}
                              onClick={() => openConfirmChangeRole(u, r)}
                            >
                              {ROLE_LABELS[r]}
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={5}
                    >
                      Aucun utilisateur ne correspond à vos critères pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
