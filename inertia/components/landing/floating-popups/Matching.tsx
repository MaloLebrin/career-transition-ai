import { Zap } from "lucide-react";
import { motion } from "motion/react";

export const Matching = () => (<motion.div
  animate={{ x: [0, 10, 0] }}
  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
  className="absolute -bottom-10 right-10 w-56 bg-white p-5 rounded-[28px] shadow-2xl border border-brand-navy/5 z-20 text-left hidden md:block"
>
  <div className="flex items-center space-x-2 mb-3">
    <div className="w-7 h-7 rounded-lg bg-brand-navy flex items-center justify-center text-white">
      <Zap size={14} />
    </div>
    <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
      Matching
    </span>
  </div>
  <div className="flex items-end gap-1">
    <div className="h-8 w-2 bg-brand-sage rounded-full" />
    <div className="h-12 w-2 bg-brand-sage rounded-full" />
    <div className="h-10 w-2 bg-brand-sage rounded-full" />
    <span className="ml-2 text-lg font-black text-brand-navy">87%</span>
  </div>
</motion.div>)
