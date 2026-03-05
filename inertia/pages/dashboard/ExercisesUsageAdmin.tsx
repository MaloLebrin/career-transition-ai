import React, { useMemo, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { isSuperAdmin } from '../../helpers/roles'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

type TotalsByType = Record<string, number>

interface OrganizationUsage {
  id: number
  name: string
  totalsByType: TotalsByType
  totalExercises: number
}

interface ExercisesUsageAdminProps {
  filters: {
    from: string
    to: string
    organizationId: number | null
  }
  organizations: OrganizationUsage[]
  organizationsOptions: { id: number; name: string }[]
}

const EXERCISE_LABELS: Record<string, string> = {
  motivation: 'Motivation',
  values: 'Valeurs',
  personality: 'Personnalité',
  life_curve: 'Courbe de vie',
  targeting: 'Ciblage',
  disc: 'DISC',
  skill_mapping: 'Cartographie',
  circle_of_control: 'Cercle de contrôle',
}

const EXERCISE_ORDER = [
  'motivation',
  'values',
  'personality',
  'life_curve',
  'targeting',
  'disc',
  'skill_mapping',
  'circle_of_control',
]

export default function ExercisesUsageAdmin({
  filters,
  organizations,
  organizationsOptions,
}: ExercisesUsageAdminProps) {
  const { user } = useAuth()
  const role = user?.role || 'employee'
  const [from, setFrom] = useState(filters.from)
  const [to, setTo] = useState(filters.to)
  const [organizationId, setOrganizationId] = useState<string>(
    filters.organizationId ? String(filters.organizationId) : ''
  )

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

  const totalExercises = useMemo(
    () => organizations.reduce((acc, org) => acc + org.totalExercises, 0),
    [organizations]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params: Record<string, string> = {
      from,
      to,
    }
    if (organizationId) {
      params.organizationId = organizationId
    }

    router.get('/dashboard/super-admin/exercises-usage', params, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  return (
    <>
      <Head title="Usage des exercices" />
      <DashboardLayout>
        <div className="space-y-8 animate-fadeIn">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
              Vue Super Admin
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-navy tracking-tight">
              Usage des exercices par organisation
            </h1>
            <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
              Volume d&apos;exercices complétés par cabinet et par type, sur la période sélectionnée.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-brand-navy/5 p-4 flex flex-col md:flex-row gap-3 items-end"
          >
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                  Du
                </span>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                  Au
                </span>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                  Organisation
                </span>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="border border-brand-navy/10 rounded-xl text-xs px-3 py-2 text-brand-navy/80 bg-white min-w-[180px]"
                >
                  <option value="">Toutes les organisations</option>
                  {organizationsOptions.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="navy">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  {totalExercises} exercices complétés
                </span>
              </Badge>
              <Button type="submit" size="sm" className="px-6">
                Mettre à jour
              </Button>
            </div>
          </form>

          <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-x-auto shadow-sm">
            <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
              <thead className="bg-brand-ivory/60">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Cabinet
                  </th>
                  {EXERCISE_ORDER.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-center text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest"
                    >
                      {EXERCISE_LABELS[key] ?? key}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-brand-ivory/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-brand-navy">{org.name}</td>
                    {EXERCISE_ORDER.map((key) => {
                      const value = org.totalsByType[key] || 0
                      return (
                        <td
                          key={key}
                          className="px-4 py-4 text-center text-xs font-bold text-brand-navy/70"
                        >
                          {value > 0 ? value : '—'}
                        </td>
                      )
                    })}
                    <td className="px-6 py-4 text-right text-xs font-bold text-brand-navy/90">
                      {org.totalExercises}
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={EXERCISE_ORDER.length + 2}
                    >
                      Aucun exercice complété sur la période sélectionnée.
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

