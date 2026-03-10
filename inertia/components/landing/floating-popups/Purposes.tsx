import { Target } from "lucide-react";
import { motion } from "motion/react";

export const Purposes = () => (<motion.div
  animate={{ y: [0, 15, 0] }}
  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
  className="absolute top-1/2 -left-6 md:-left-20 w-60 bg-white p-6 rounded-[32px] shadow-2xl border border-brand-navy/5 z-20 text-left"
>
  <div className="flex items-center space-x-2 mb-4">
    <div className="w-8 h-8 rounded-xl bg-brand-sage flex items-center justify-center text-white">
      <Target size={18} />
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-navy/40">
      Objectif
    </span>
  </div>
  <p className="text-xs font-bold text-brand-navy leading-relaxed">
    Reconversion vers : <br />
    <span className="text-brand-sage">Responsable RSE</span>
  </p>
</motion.div>)
