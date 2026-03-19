import { format, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import React, { memo, useCallback, useMemo, useState } from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('fr', fr)

export interface DateTimePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
  error?: string
  hint?: string
  disabled?: boolean
  minuteStep?: number
}

function parseToDate(value: string): Date | null {
  if (!value) return null
  const iso = parseISO(value)
  if (isValid(iso)) return iso
  return null
}

function formatDatePart(date: Date | null): string {
  if (!date) return ''
  return format(date, 'dd/MM/yyyy')
}

function formatTimePart(date: Date | null): string {
  if (!date) return ''
  return format(date, 'HH:mm')
}

function buildIsoValue(date: Date | null, time: string): string {
  if (!date || !time) return ''
  const [hours, minutes] = time.split(':').map((p) => Number(p) || 0)
  const merged = new Date(date)
  merged.setHours(hours, minutes, 0, 0)
  return merged.toISOString()
}

const DateTimePicker = memo(function DateTimePicker({
  label,
  value,
  onChange,
  placeholder = 'Choisir une date',
  required = false,
  className = '',
  id: providedId,
  error,
  hint,
  disabled = false,
  minuteStep = 15,
}: DateTimePickerProps) {
  const id = providedId ?? `datetimepicker-${React.useId()}`
  const labelId = `${id}-label`
  const timeSelectId = `${id}-time`
  const date = useMemo(() => parseToDate(value), [value])
  const dateLabel = formatDatePart(date)
  const [internalTime, setInternalTime] = useState<string>(formatTimePart(date))

  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

  const timeOptions = useMemo(() => {
    const opts: string[] = []
    for (let h = 0; h < 24; h += 1) {
      for (let m = 0; m < 60; m += minuteStep) {
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        opts.push(`${hh}:${mm}`)
      }
    }
    return opts
  }, [minuteStep])

  const handleDateChange = useCallback(
    (selected: Date | null) => {
      const iso = buildIsoValue(selected, internalTime)
      onChange(iso)
    },
    [internalTime, onChange, value]
  )

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const time = e.target.value
      setInternalTime(time)
      const currentDate = parseToDate(value)
      const iso = buildIsoValue(currentDate, time)
      onChange(iso)
    },
    [onChange, value]
  )

  const inputClasses = [
    'w-full bg-white border rounded-2xl outline-none font-medium transition-all text-sm h-[54px] pl-2',
    'placeholder:text-brand-navy/20',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
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
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
        <ReactDatePicker
          id={id}
          selected={date}
          onChange={handleDateChange as any}
          dateFormat="dd/MM/yyyy"
          locale="fr"
          placeholderText={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
          wrapperClassName="w-full"
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
        <select
          id={timeSelectId}
          value={internalTime}
          onChange={handleTimeChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          aria-describedby={describedBy}
        >
          <option value="">{dateLabel ? 'Choisir une heure' : 'Sélectionnez une date d’abord'}</option>
          {timeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
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

DateTimePicker.displayName = 'DateTimePicker'

export default DateTimePicker

