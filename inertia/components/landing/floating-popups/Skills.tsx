import { Award } from "lucide-react"
import { motion } from "motion/react"

export const Skills = () => (
  <motion.div
    animate={{ scale: [1, 1.02, 1] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute top-1/4 -left-32 w-44 bg-white p-4 rounded-[24px] shadow-2xl border border-brand-navy/5 z-20 text-left hidden 2xl:block"
  >
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-brand-terracotta/20 flex items-center justify-center text-brand-terracotta">
        <Award size={12} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
        Compétences
      </span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {['Leadership', 'Agilité', 'RSE'].map((skill) => (
        <span
          key={skill}
          className="px-2 py-0.5 bg-brand-navy/5 rounded-full text-[8px] font-bold text-brand-navy/60"
        >
          {skill}
        </span>
      ))}
    </div>
  </motion.div>
)
