import { ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export const Certification = () => (
  <motion.div
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute top-10 left-1/4 w-48 bg-brand-sage text-white p-4 rounded-[24px] shadow-xl z-20 text-left hidden lg:block"
  >
    <div className="flex items-center space-x-2 mb-2">
      <ShieldCheck size={14} />
      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
        Certifié
      </span>
    </div>
    <p className="text-[10px] font-bold">Bilan conforme Qualiopi</p>
  </motion.div>)
