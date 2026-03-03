
import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale/fr';
import { format, parse, parseISO } from 'date-fns';

registerLocale('fr', fr);

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'date' | 'month';
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'date', 
  placeholder = '...', 
  required = false,
  className = ''
}) => {
  const isMonth = type === 'month';
  const dateFormat = isMonth ? 'MM/yyyy' : 'dd/MM/yyyy';
  const valueFormat = isMonth ? 'yyyy-MM' : 'yyyy-MM-dd';

  const handleChange = (date: Date | null) => {
    if (date) {
      onChange(format(date, valueFormat));
    } else {
      onChange('');
    }
  };

  const selectedDate = value ? (isMonth ? parse(value, 'yyyy-MM', new Date()) : parseISO(value)) : null;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          {label}
        </label>
      )}
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat={dateFormat}
        showMonthYearPicker={isMonth}
        locale="fr"
        placeholderText={placeholder}
        required={required}
        className="w-full p-4 bg-white border border-brand-navy/10 rounded-2xl outline-none font-medium transition-all focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5 placeholder:text-brand-navy/20 text-sm h-[54px]"
        wrapperClassName="w-full"
      />
    </div>
  );
};

export default DatePicker;
