import { Cpu } from "lucide-react";
import { motion } from "motion/react";

export const Disc = () => (
  <motion.div
    animate={{ scale: [1, 1.04, 1] }}
    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-6 w-60 bg-white p-5 rounded-[28px] shadow-2xl border border-brand-navy/5 z-30 text-left hidden xl:block"
  >
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy">
        <Cpu size={14} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
        Profil DISC
      </span>
    </div>
    <p className="text-[10px] font-bold text-brand-navy leading-snug mb-1">
      Style dominant&nbsp;: <span className="text-brand-sage">I / S</span>
    </p>
    <p className="text-[9px] text-brand-navy/60 leading-snug">
      Communication collaborative, énergie positive, rythme stable.
    </p>
  </motion.div>
)
