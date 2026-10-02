import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { useMemo } from 'react'

interface AvatarProps {
  userName?: string
  userRole: UserRole
}

export const Avatar = ({ userName, userRole }: AvatarProps) => {
  const roleToDisplay = useMemo(() => {
    if (userRole === USERS_ROLES.ADVISOR) return 'Expert Accompagnateur'
    if (userRole === USERS_ROLES.ADMIN || userRole === USERS_ROLES.SUPER_ADMIN)
      return 'Administrateur'
    if (userRole === USERS_ROLES.EMPLOYEE) return 'Candidat Transition'
    return 'Utilisateur'
  }, [userRole])

  return (
    <div className="hidden sm:flex items-center space-x-4 mr-2">
      <div className="text-right">
        <div className="text-xs font-bold text-ink leading-none">{userName || 'Utilisateur'}</div>
        <div className="text-[9px] font-bold text-accent uppercase tracking-widest mt-1">
          {roleToDisplay}
        </div>
      </div>
      <div className="h-10 w-10 rounded-2xl bg-canvas border-2 border-surface shadow-card overflow-hidden flex items-center justify-center">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'Felix'}`}
          alt="avatar"
        />
      </div>
    </div>
  )
}
