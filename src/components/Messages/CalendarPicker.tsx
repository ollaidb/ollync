import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './CalendarPicker.css'

interface CalendarPickerProps {
  selectedDate: string | null
  onDateSelect: (date: string) => void
  minDate?: string
}

const CalendarPicker = ({ selectedDate, onDateSelect, minDate }: CalendarPickerProps) => {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate)
    }
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      const min = new Date(minDate)
      min.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return checkDate < min
    }
    const todayDate = new Date(today)
    todayDate.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < todayDate
  }

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false
    const selected = new Date(selectedDate)
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    const todayDate = new Date(today)
    return (
      date.getDate() === todayDate.getDate() &&
      date.getMonth() === todayDate.getMonth() &&
      date.getFullYear() === todayDate.getFullYear()
    )
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (!isDateDisabled(date)) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const dayStr = String(day).padStart(2, '0')
      onDateSelect(`${year}-${month}-${dayStr}`)
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = []

  // Jours vides au début
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return (
    <div className="calendar-picker">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn"
          onClick={previousMonth}
          aria-label="Mois précédent"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="calendar-month-title">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          className="calendar-nav-btn"
          onClick={nextMonth}
          aria-label="Mois suivant"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day empty" />
          }

          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const disabled = isDateDisabled(date)
          const selected = isSelectedDate(date)
          const isTodayDate = isToday(date)

          return (
            <button
              key={day}
              className={`calendar-day ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
              onClick={() => handleDateClick(day)}
              disabled={disabled}
              aria-label={`${day} ${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarPicker
