import React, { useCallback, memo, useMemo } from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fr } from 'date-fns/locale/fr'
import { format, parse, parseISO, isValid } from 'date-fns'

registerLocale('fr', fr)

export type DatePickerType = 'date' | 'month'

export interface DatePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  type?: DatePickerType
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
  error?: string
  hint?: string
  disabled?: boolean
}

const DatePicker = memo(function DatePicker({
  label,
  value,
  onChange,
  type = 'date',
  placeholder = '...',
  required = false,
  className = '',
  id: providedId,
  error,
  hint,
  disabled = false,
}: DatePickerProps) {
  const id = providedId ?? `datepicker-${React.useId()}`
  const labelId = `${id}-label`
  const isMonth = type === 'month'
  const dateFormat = isMonth ? 'MM/yyyy' : 'dd/MM/yyyy'
  const valueFormat = isMonth ? 'yyyy-MM-01' : 'yyyy-MM-dd'

  const handleChange = useCallback(
    (date: Date | null) => {
      if (date) {
        onChange(format(date, valueFormat))
      } else {
        onChange('')
      }
    },
    [onChange, valueFormat]
  )

  const selectedDate = useMemo(() => {
    if (!value) return null
    
    // Try parseISO first as it's the most common format from server
    const isoDate = parseISO(value)
    if (isValid(isoDate)) return isoDate

    // Fallback to custom month parsing if needed
    if (isMonth) {
      const parsedMonth = parse(value, 'yyyy-MM', new Date())
      if (isValid(parsedMonth)) return parsedMonth
    }
    
    return null
  }, [value, isMonth])

  const inputClassName = [
    'w-full p-4 bg-white border rounded-2xl outline-none font-medium transition-all text-sm h-[54px]',
    'placeholder:text-brand-navy/20',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    error
      ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10'
      : 'border-brand-navy/10 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5',
  ].join(' ')

  return (
    <div
      className={`space-y-1.5 w-full ${className}`.trim()}
      role="group"
      aria-labelledby={label ? labelId : undefined}
    >
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block"
        >
          {label}
          {required && (
            <span className="text-rose-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <ReactDatePicker
        id={id}
        selected={selectedDate}
        onChange={handleChange as any}
        dateFormat={dateFormat}
        showMonthYearPicker={isMonth}
        locale="fr"
        placeholderText={placeholder}
        required={required}
        disabled={disabled}
        className={inputClassName}
        wrapperClassName="w-full"
        aria-invalid={error ? "true" : "false"}
        aria-required={required ? "true" : "false"}
        aria-describedby={
          [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
        }
      />
      {error && (
        <p id={`${id}-error`} className="text-[9px] font-bold text-rose-500 px-2" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[9px] font-medium text-slate-400 px-2">
          {hint}
        </p>
      )}
    </div>
  )
})

DatePicker.displayName = 'DatePicker'

export default DatePicker
