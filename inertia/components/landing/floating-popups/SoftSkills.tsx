import { Compass } from "lucide-react";
import { motion } from "motion/react";

export const SoftSkills = () => (
  <motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
    className="absolute bottom-1/4 -right-4 md:-right-16 w-52 bg-white p-5 rounded-[28px] shadow-2xl border border-brand-navy/5 z-20 text-left hidden xl:block"
  >
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta">
        <Compass size={14} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
        Soft Skills
      </span>
    </div>
    <div className="space-y-2">
      <div className="h-1.5 w-full bg-brand-navy/5 rounded-full overflow-hidden">
        <div className="h-full w-[85%] bg-brand-terracotta" />
      </div>
      <p className="text-[9px] font-bold text-brand-navy/60">Adaptabilité : 85%</p>
    </div>
  </motion.div>)
