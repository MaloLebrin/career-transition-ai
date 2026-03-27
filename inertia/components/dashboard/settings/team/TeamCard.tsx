import { TeamMember } from "~/components/dashboard/settings/team/TeamMember";
import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import { Advisor } from "~/types";
import { UserSession } from "~/types/auth";

interface TeamProps {
  team: Advisor[];
  setIsInviteModalOpen: (isOpen: boolean) => void;
  user: UserSession;
}

export const TeamCard = ({
  team = [],
  setIsInviteModalOpen,
  user,
}: TeamProps) => {
  return (
    <Card className="p-10 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-900 flex items-center">
          <span className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3">
            👥
          </span>
          Mon Équipe
        </h3>
        <Button onClick={() => setIsInviteModalOpen(true)} variant="ghost" size="sm">
          + Inviter un collaborateur
        </Button>
      </div>

      <div className="space-y-4">
        {team.length > 0 ? (
          team.map((member) => (
            <TeamMember
              key={member.id}
              name={member.name}
              role={member.role}
              email={member.email}
              isMe={user?.id === member.id}
            />
          ))
        ) : (
          <p className="text-center py-8 text-slate-400 italic text-sm">
            Aucun collaborateur trouvé.
          </p>
        )}
      </div>
    </Card>
  );
};
