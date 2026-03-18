import React from 'react'

interface Props {
  inControl: string[]
  outControl: string[]
}

const CircleOfControlResultView: React.FC<Props> = ({ inControl, outControl }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="p-8 bg-violet-50 rounded-[48px] border border-violet-100 shadow-sm">
        <h4 className="text-sm font-black text-violet-600 uppercase mb-6 flex items-center">
          <span className="w-2 h-2 bg-violet-500 rounded-full mr-2" />
          Sous contrôle
        </h4>
        <div className="flex flex-wrap gap-2">
          {inControl.map((item, i) => (
            <span
              key={i}
              className="text-[10px] bg-white px-4 py-2 rounded-xl border border-violet-100 font-black text-slate-700 uppercase tracking-widest"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="p-8 bg-pink-50 rounded-[48px] border border-pink-100 shadow-sm">
        <h4 className="text-sm font-black text-pink-600 uppercase mb-6 flex items-center">
          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2" />
          Hors contrôle
        </h4>
        <div className="flex flex-wrap gap-2">
          {outControl.map((item, i) => (
            <span
              key={i}
              className="text-[10px] bg-white px-4 py-2 rounded-xl border border-pink-100 font-black text-slate-700 uppercase tracking-widest"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CircleOfControlResultView
