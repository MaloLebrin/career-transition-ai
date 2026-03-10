import { MessageSquare } from "lucide-react";
import { motion } from "motion/react";

export const CoachFeedback = () => (
  <motion.div
    animate={{ x: [0, -10, 0] }}
    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
    className="absolute top-1/3 -right-20 w-48 bg-white p-4 rounded-[24px] shadow-2xl border border-brand-navy/5 z-20 text-left hidden 2xl:block"
  >
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-sage">
        <MessageSquare size={12} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
        Coach Feedback
      </span>
    </div>
    <p className="text-[10px] font-medium text-brand-navy/70 leading-tight">
      &quot;Excellent profil pour le management de transition.&quot;
    </p>
  </motion.div>
)
