import React from 'react'

interface Props {
  data: unknown
}

const DefaultResultView: React.FC<Props> = ({ data }) => {
  return (
    <pre className="text-xs bg-slate-50 p-6 rounded-[32px] overflow-auto border border-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default DefaultResultView
