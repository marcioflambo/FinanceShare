import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths, startOfMonth, endOfMonth, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdvancedCalendarProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function AdvancedCalendar({ startDate, endDate, onDateRangeChange }: AdvancedCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate calendar days
  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Generate years for picker
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Generate months for picker
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleDateClick = (clickedDate: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onDateRangeChange(clickedDate, null);
    } else if (startDate && !endDate) {
      // Complete range selection
      if (clickedDate < startDate) {
        onDateRangeChange(clickedDate, startDate);
      } else {
        onDateRangeChange(startDate, clickedDate);
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isRangeStart = (date: Date) => {
    return startDate && isSameDay(date, startDate);
  };

  const isRangeEnd = (date: Date) => {
    return endDate && isSameDay(date, endDate);
  };

  const clearSelection = () => {
    onDateRangeChange(null, null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  const selectYear = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setShowYearPicker(false);
  };

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(monthIndex);
    setCurrentMonth(newDate);
    setShowMonthPicker(false);
  };

  const quickSelections = [
    {
      label: "Hoje",
      action: () => {
        const today = new Date();
        onDateRangeChange(today, today);
      }
    },
    {
      label: "Últimos 7 dias",
      action: () => {
        const today = new Date();
        const lastWeek = addDays(today, -7);
        onDateRangeChange(lastWeek, today);
      }
    },
    {
      label: "Últimos 30 dias",
      action: () => {
        const today = new Date();
        const lastMonth = addDays(today, -30);
        onDateRangeChange(lastMonth, today);
      }
    },
    {
      label: "Este mês",
      action: () => {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        onDateRangeChange(startOfCurrentMonth, today);
      }
    }
  ];

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header with navigation */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="text-white hover:bg-white/20 font-medium"
            >
              {format(currentMonth, "MMMM", { locale: ptBR })}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-white hover:bg-white/20 font-medium"
            >
              {format(currentMonth, "yyyy")}
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Selection Status */}
        <div className="mt-3 text-center">
          <div className="text-sm">
            {!startDate && !endDate && (
              <span className="flex items-center justify-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Selecione o período desejado
              </span>
            )}
            {startDate && !endDate && "Selecione a data de fim"}
            {startDate && endDate && (
              <span className="font-medium">
                {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Year Picker */}
      {showYearPicker && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
            {years.map((year) => (
              <Button
                key={year}
                variant="ghost"
                size="sm"
                onClick={() => selectYear(year)}
                className={cn(
                  "h-8 text-xs",
                  getYear(currentMonth) === year && "bg-blue-100 text-blue-600"
                )}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Month Picker */}
      {showMonthPicker && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                variant="ghost"
                size="sm"
                onClick={() => selectMonth(index)}
                className={cn(
                  "h-8 text-xs",
                  getMonth(currentMonth) === index && "bg-blue-100 text-blue-600"
                )}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-gray-700 bg-gray-50 rounded">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isRangeStart(day) || isRangeEnd(day);
            const isInRangeDay = isInRange(day);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "h-10 w-full text-sm font-medium rounded transition-all duration-200 relative",
                  "hover:scale-105 hover:shadow-sm",
                  !isCurrentMonth && "text-gray-300 hover:text-gray-400",
                  isCurrentMonth && !isSelected && !isInRangeDay && "text-gray-700 hover:bg-blue-50",
                  isToday && !isSelected && "ring-2 ring-blue-300 bg-blue-50",
                  isSelected && "bg-blue-500 text-white shadow-md scale-105",
                  isInRangeDay && !isSelected && "bg-blue-100 text-blue-700",
                  isRangeStart(day) && isRangeEnd(day) && "rounded-full",
                  isRangeStart(day) && !isRangeEnd(day) && "rounded-l-full rounded-r-none",
                  isRangeEnd(day) && !isRangeStart(day) && "rounded-r-full rounded-l-none",
                  isInRangeDay && !isSelected && !isRangeStart(day) && !isRangeEnd(day) && "rounded-none"
                )}
              >
                {format(day, "d")}
                {isToday && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick selection buttons */}
        <div className="border-t pt-4">
          <div className="text-xs font-medium text-gray-600 mb-3">Seleções Rápidas:</div>
          <div className="grid grid-cols-2 gap-2">
            {quickSelections.map((selection, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={selection.action}
                className="text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                {selection.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Clear selection */}
        {(startDate || endDate) && (
          <div className="border-t pt-4 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelection}
              className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Limpar Seleção
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}