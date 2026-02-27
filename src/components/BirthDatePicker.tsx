import { useState, useRef, useEffect } from 'react'
import { DayPicker, type DropdownProps } from 'react-day-picker'
import { format, parse, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, ChevronDown } from 'lucide-react'
import 'react-day-picker/style.css'
import './BirthDatePicker.css'

/** Dropdown personnalisé pour mois/année (remplace le select natif) */
function CustomMonthYearDropdown(props: DropdownProps) {
  const { options, value, onChange, 'aria-label': ariaLabel, disabled, className } = props
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options?.find((opt) => String(opt.value) === String(value))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (optValue: string | number) => {
    onChange?.({ target: { value: String(optValue) } } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`birth-date-custom-dropdown ${className ?? ''}`.trim()}
      data-disabled={disabled}
      data-open={open}
    >
      <button
        type="button"
        className="birth-date-custom-dropdown-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="birth-date-custom-dropdown-label">{selectedOption?.label ?? ''}</span>
        <ChevronDown size={16} className="birth-date-custom-dropdown-chevron" aria-hidden />
      </button>
      {open && options && options.length > 0 && (
        <div
          className="birth-date-custom-dropdown-list"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={String(opt.value) === String(value)}
              className={`birth-date-custom-dropdown-item ${String(opt.value) === String(value) ? 'selected' : ''}`}
              disabled={opt.disabled}
              onClick={() => !opt.disabled && handleSelect(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface BirthDatePickerProps {
  value: string
  onChange: (value: string) => void
  id?: string
  disabled?: boolean
  placeholder?: string
}

const BirthDatePicker = ({
  value,
  onChange,
  id = 'birth_date',
  disabled = false,
  placeholder = 'jj/mm/aaaa'
}: BirthDatePickerProps) => {
  const [open, setOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      try {
        const d = parse(value, 'yyyy-MM-dd', new Date())
        if (!isNaN(d.getTime())) {
          setDisplayValue(format(d, 'dd/MM/yyyy', { locale: fr }))
        } else {
          setDisplayValue('')
        }
      } catch {
        setDisplayValue('')
      }
    } else {
      setDisplayValue('')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const today = new Date()

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <div className="birth-date-picker-wrapper" ref={containerRef}>
      <button
        type="button"
        className="birth-date-picker-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        id={id}
        aria-label="Choisir une date de naissance"
      >
        <Calendar size={18} className="birth-date-picker-icon" aria-hidden />
        <span className={displayValue ? '' : 'birth-date-picker-placeholder'}>
          {displayValue || placeholder}
        </span>
      </button>
      {open && (
        <>
          <div
            className="birth-date-picker-overlay"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="birth-date-picker-popover rdp-root" role="dialog">
            <DayPicker
              mode="single"
              selected={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : undefined}
              onSelect={handleSelect}
              locale={fr}
              disabled={(date) => isAfter(date, today)}
              startMonth={new Date(1900, 0)}
              endMonth={today}
              captionLayout="dropdown"
              components={{ Dropdown: CustomMonthYearDropdown }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default BirthDatePicker
