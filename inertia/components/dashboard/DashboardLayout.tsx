import { isAdvisorOrAdmin, isSuperAdmin } from '#shared/helpers/roles'
import { Transmit } from '@adonisjs/transmit-client'
import React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/use_auth'
import Layout from '../layout/Layout'
import { AdvisorSidebar } from './AdvisorSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  /** For advisor: selected employee id to highlight in sidebar. From route /dashboard/conseiller/employees/:id */
  selectedEmployeeId?: string | null
  /** Hide the sidebar (useful for exercise pages that need full width) */
  hideSidebar?: boolean
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  selectedEmployeeId = null,
  hideSidebar = false,
}) => {
  const { user, logout } = useAuth()
  const [pdfJobStatuses, setPdfJobStatuses] = useState<Record<number, string>>({})

  if (!user) {
    return null
  }

  const userRole = user.role || 'employee'
  const isAdvisor = isAdvisorOrAdmin(userRole)
  const superAdmin = isSuperAdmin(userRole)
  const showSidebar = isAdvisor && !hideSidebar

  useEffect(() => {
    if (!user || !showSidebar) return

    const transmit = new Transmit({
      baseUrl: window.location.origin,
    })
    const subscription = transmit.subscription(`users/${user.id}/pdf-exports`)
    let unsubscribe: (() => void) | null = null

    subscription
      .create()
      .then(() => {
        unsubscribe = subscription.onMessage((data: any) => {
          const status = String(data?.status)
          const id = Number(data?.id)
          if (!id) return
          setPdfJobStatuses((prev) => ({ ...prev, [id]: status }))
        })
      })
      .catch(() => {})

    return () => {
      if (unsubscribe) unsubscribe()
      subscription.delete().catch(() => {})
    }
  }, [showSidebar, user])

  return (
    <Layout userRole={userRole} onRoleChange={() => {}} onLogout={logout} userName={user.name}>
      {showSidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 flex-1 min-h-0">
          <AdvisorSidebar
            selectedEmployeeId={selectedEmployeeId}
            showSuperAdminLinks={superAdmin}
            activePdfJobsCount={Object.values(pdfJobStatuses).filter(
              (s) => s === 'pending' || s === 'processing'
            ).length}
          />
          <div className="lg:col-span-5">{children}</div>
        </div>  
      ) : (
        <>{children}</>
      )}
    </Layout>
  )
}

export default DashboardLayout
