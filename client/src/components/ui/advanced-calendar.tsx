import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdvancedCalendarProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function AdvancedCalendar({ startDate, endDate, onDateRangeChange }: AdvancedCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);

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

  const handleDateClick = (clickedDate: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onDateRangeChange(clickedDate, null);
      setSelecting('end');
    } else if (startDate && !endDate) {
      // Complete range selection
      if (clickedDate < startDate) {
        onDateRangeChange(clickedDate, startDate);
      } else {
        onDateRangeChange(startDate, clickedDate);
      }
      setSelecting(null);
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
    setSelecting(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection Status */}
      <div className="mb-4 text-center">
        <div className="text-sm text-gray-600">
          {!startDate && !endDate && "Selecione a data de início"}
          {startDate && !endDate && "Selecione a data de fim"}
          {startDate && endDate && (
            <span className="text-green-600 font-medium">
              {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
            </span>
          )}
        </div>
        {(startDate || endDate) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Limpar seleção
          </Button>
        )}
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = isRangeStart(day) || isRangeEnd(day);
          const isInRangeDay = isInRange(day);

          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-8 w-8 p-0 text-xs relative",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && "hover:bg-blue-50",
                isToday && "ring-1 ring-blue-500",
                isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                isInRangeDay && !isSelected && "bg-blue-100 text-blue-700",
                isRangeStart(day) && "rounded-r-none",
                isRangeEnd(day) && "rounded-l-none",
                isInRangeDay && !isSelected && !isRangeStart(day) && !isRangeEnd(day) && "rounded-none"
              )}
            >
              {format(day, "d")}
            </Button>
          );
        })}
      </div>

      {/* Quick selection buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            const lastWeek = addDays(today, -7);
            onDateRangeChange(lastWeek, today);
          }}
          className="text-xs"
        >
          Últimos 7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            const lastMonth = addDays(today, -30);
            onDateRangeChange(lastMonth, today);
          }}
          className="text-xs"
        >
          Últimos 30 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            const startOfCurrentMonth = startOfMonth(today);
            onDateRangeChange(startOfCurrentMonth, today);
          }}
          className="text-xs"
        >
          Este mês
        </Button>
      </div>
    </div>
  );
}