import React from 'react'
import { isAdvisorOrAdmin, isSuperAdmin } from '../../helpers/roles'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../layout/Layout'
import AdvisorSidebar from './AdvisorSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  /** For advisor: selected employee id to highlight in sidebar. From route /dashboard/conseiller/employees/:id */
  selectedEmployeeId?: string | null
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  selectedEmployeeId = null,
}) => {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const userRole = user.role || 'employee'
  const isAdvisor = isAdvisorOrAdmin(userRole)
  const superAdmin = isSuperAdmin(userRole)

  return (
    <Layout userRole={userRole} onRoleChange={() => {}} onLogout={logout} userName={user.name}>
      {isAdvisor ? (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 flex-1 min-h-0">
          <AdvisorSidebar
            selectedEmployeeId={selectedEmployeeId}
            showSuperAdminLinks={superAdmin}
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
