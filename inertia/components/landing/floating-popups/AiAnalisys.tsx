import { BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

export const AiAnalisys = () => (
  <motion.div
    animate={{ y: [0, -15, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute -top-12 -right-6 md:-right-12 w-64 bg-white p-6 rounded-[32px] shadow-2xl border border-brand-navy/5 z-20 text-left"
  >
    <div className="flex items-center space-x-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-brand-terracotta flex items-center justify-center text-white">
        <BrainCircuit size={18} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-brand-navy/40">
        Analyse IA
      </span>
    </div>
    <p className="text-xs font-bold text-brand-navy leading-relaxed italic">
      &quot;Synergie détectée entre leadership naturel et agilité technique (94%).&quot;
    </p>
  </motion.div>
)
