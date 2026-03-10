import { Calendar } from "lucide-react";
import { motion } from "motion/react";

export const Appointnement = () => (
  <motion.div
    animate={{ y: [0, 10, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
    className="absolute -bottom-16 left-1/4 w-56 bg-white p-5 rounded-[28px] shadow-2xl border border-brand-navy/5 z-20 text-left hidden lg:block"
  >
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy">
        <Calendar size={14} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
        Prochaine Session
      </span>
    </div>
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex flex-col items-center justify-center text-brand-sage">
        <span className="text-[8px] font-bold">MARS</span>
        <span className="text-sm font-black leading-none">12</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-navy">Entretien de synthèse</p>
        <p className="text-[9px] text-brand-navy/40 font-medium">
          14:30 • Cabinet Expert
        </p>
      </div>
    </div>
  </motion.div>
) 
