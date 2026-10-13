import { Head, router } from '@inertiajs/react'
import { Fragment, useState } from 'react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import type { PaginationMeta } from '#shared/types/pagination'
import type { SkillItem } from '#shared/types/skill/admin'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { SkillForm } from '~/components/dashboard/admin/SkillForm'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import ConfirmModal from '~/components/ui/ConfirmModal'
import Input from '~/components/ui/Input'
import { Pagination } from '~/components/ui/Pagination'
import { useServerList } from '~/hooks/use_server_list'

interface SkillsAdminProps {
  skills: SkillItem[]
  pagination: PaginationMeta
  filters: { search: string }
}

const LIST_ONLY = ['skills']

/** Catalogue de compétences global : ajout, renommage, suppression des compétences non utilisées (#73). */
export default function SkillsAdmin({ skills, pagination, filters }: SkillsAdminProps) {
  const { values, setSearch, goToPage } = useServerList(
    SUPER_ADMIN_PATHS.skills,
    { search: filters.search },
    LIST_ONLY
  )
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<SkillItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const confirmDelete = () => {
    if (!deleting || submitting) return
    setSubmitting(true)
    router.delete(SUPER_ADMIN_PATHS.skill(deleting.id), {
      preserveScroll: true,
      onFinish: () => {
        setSubmitting(false)
        setDeleting(null)
      },
    })
  }

  return (
    <>
      <Head title="Compétences" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h1 className="font-display text-display-sm text-ink">Catalogue de compétences</h1>
            <p className="text-sm text-muted">
              Compétences proposées à tous les candidats. Une compétence portée par des candidats ne
              peut pas être supprimée.
            </p>
          </div>

          <Card className="space-y-4">
            <h2 className="text-title-md text-ink">Ajouter une compétence</h2>
            <SkillForm />
          </Card>

          <Input
            type="search"
            aria-label="Rechercher une compétence"
            placeholder="Rechercher par nom ou catégorie…"
            value={values.search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Card padding="none">
            <table className="w-full text-sm" aria-label="Compétences du catalogue">
              <thead>
                <tr className="border-b border-hairline text-left text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Compétence
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Catégorie
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Candidats
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <Fragment key={skill.id}>
                    <tr className="border-b border-hairline last:border-b-0">
                      <td className="px-5 py-3 font-medium text-ink">{skill.name}</td>
                      <td className="px-5 py-3 text-ink-soft">{skill.category ?? '—'}</td>
                      <td className="px-5 py-3 text-ink-soft">{skill.employeesCount}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => setEditingId(skill.id)}
                          >
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeleting(skill)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {editingId === skill.id && (
                      <tr className="border-b border-hairline bg-surface-soft">
                        <td colSpan={4} className="px-5 py-4">
                          <SkillForm skill={skill} onDone={() => setEditingId(null)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {skills.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-muted">
                      {filters.search
                        ? 'Aucune compétence ne correspond à cette recherche.'
                        : 'Le catalogue est vide.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <Pagination
            page={pagination.page}
            lastPage={pagination.lastPage}
            onPageChange={goToPage}
          />

          <ConfirmModal
            isOpen={deleting !== null}
            variant="danger"
            title="Supprimer cette compétence ?"
            description={
              deleting
                ? `« ${deleting.name} » sera retirée du catalogue. Si des candidats la portent, la suppression sera refusée.`
                : undefined
            }
            confirmLabel="Supprimer"
            state={submitting ? 'loading' : 'idle'}
            onCancel={() => !submitting && setDeleting(null)}
            onConfirm={confirmDelete}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
