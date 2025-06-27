import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings } from "lucide-react";
import { Button } from "./button";
import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Checkbox } from "./checkbox";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths, startOfMonth, endOfMonth, getYear, getMonth, getWeek, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdvancedCalendarProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

type SelectionMode = 'single' | 'multiple' | 'range';

export function AdvancedCalendar({ startDate, endDate, onDateRangeChange }: AdvancedCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Calendar options (DevExpress style)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('range');
  const [selectWeekOnClick, setSelectWeekOnClick] = useState(false);
  const [showWeekNumbers, setShowWeekNumbers] = useState(true);
  const [disableWeekends, setDisableWeekends] = useState(false);
  const [hasMinDate, setHasMinDate] = useState(false);
  const [hasMaxDate, setHasMaxDate] = useState(false);
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const today = new Date();
  const msInDay = 1000 * 60 * 60 * 24;
  
  // Calculate min/max dates
  const minDate = hasMinDate ? new Date(today.getTime() - msInDay * 3) : null;
  const maxDate = hasMaxDate ? new Date(today.getTime() + msInDay * 3) : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate calendar weeks for week numbers
  const weeks = [];
  let weekStart = calendarStart;
  while (weekStart <= calendarEnd) {
    weeks.push(weekStart);
    weekStart = addDays(weekStart, 7);
  }

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

  const isDateDisabled = (date: Date) => {
    if (disableWeekends && isWeekend(date)) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (clickedDate: Date) => {
    if (isDateDisabled(clickedDate)) return;

    if (selectWeekOnClick) {
      // Select entire week
      const weekStart = startOfWeek(clickedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(clickedDate, { weekStartsOn: 0 });
      onDateRangeChange(weekStart, weekEnd);
      return;
    }

    switch (selectionMode) {
      case 'single':
        onDateRangeChange(clickedDate, clickedDate);
        setSelectedDates([clickedDate]);
        break;
      
      case 'multiple':
        const newSelectedDates = [...selectedDates];
        const existingIndex = newSelectedDates.findIndex(d => isSameDay(d, clickedDate));
        
        if (existingIndex >= 0) {
          newSelectedDates.splice(existingIndex, 1);
        } else {
          newSelectedDates.push(clickedDate);
        }
        
        setSelectedDates(newSelectedDates);
        if (newSelectedDates.length > 0) {
          const sortedDates = newSelectedDates.sort((a, b) => a.getTime() - b.getTime());
          onDateRangeChange(sortedDates[0], sortedDates[sortedDates.length - 1]);
        } else {
          onDateRangeChange(null, null);
        }
        break;
      
      case 'range':
      default:
        if (!startDate || (startDate && endDate)) {
          onDateRangeChange(clickedDate, null);
          setSelectedDates([clickedDate]);
        } else if (startDate && !endDate) {
          if (clickedDate < startDate) {
            onDateRangeChange(clickedDate, startDate);
          } else {
            onDateRangeChange(startDate, clickedDate);
          }
          setSelectedDates([]);
        }
        break;
    }
  };

  const handleWeekClick = (weekStartDate: Date) => {
    if (!selectWeekOnClick) return;
    
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 0 });
    onDateRangeChange(weekStartDate, weekEnd);
  };

  const isInRange = (date: Date) => {
    if (selectionMode === 'multiple') {
      return selectedDates.some(d => isSameDay(d, date));
    }
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
    setSelectedDates([]);
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

  return (
    <div className="flex bg-white rounded-lg border shadow-sm overflow-hidden min-h-[600px]">
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col">
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
              {!startDate && !endDate && selectedDates.length === 0 && (
                <span className="flex items-center justify-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Modo: {selectionMode === 'single' ? 'Única' : selectionMode === 'multiple' ? 'Múltipla' : 'Período'}
                </span>
              )}
              {startDate && !endDate && selectionMode === 'range' && "Selecione a data de fim"}
              {startDate && endDate && (
                <span className="font-medium">
                  {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
                </span>
              )}
              {selectionMode === 'multiple' && selectedDates.length > 0 && (
                <span className="font-medium">
                  {selectedDates.length} data{selectedDates.length !== 1 ? 's' : ''} selecionada{selectedDates.length !== 1 ? 's' : ''}
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

        <div className="flex-1 p-4">
          {/* Calendar header with week numbers */}
          <div className={cn("grid gap-1 mb-3", showWeekNumbers ? "grid-cols-8" : "grid-cols-7")}>
            {showWeekNumbers && <div className="h-10 flex items-center justify-center text-xs font-semibold text-gray-500">#</div>}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-gray-700 bg-gray-50 rounded">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid with week numbers */}
          <div className="space-y-1">
            {weeks.map((weekStart, weekIndex) => (
              <div key={weekIndex} className={cn("grid gap-1", showWeekNumbers ? "grid-cols-8" : "grid-cols-7")}>
                {showWeekNumbers && (
                  <button
                    onClick={() => handleWeekClick(weekStart)}
                    className="h-10 flex items-center justify-center text-xs text-gray-500 hover:bg-blue-50 rounded transition-colors"
                  >
                    {getWeek(weekStart)}
                  </button>
                )}
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = addDays(weekStart, dayIndex);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, today);
                  const isSelected = isRangeStart(day) || isRangeEnd(day);
                  const isInRangeDay = isInRange(day);
                  const isDisabled = isDateDisabled(day);

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => handleDateClick(day)}
                      disabled={isDisabled}
                      className={cn(
                        "h-10 w-full text-sm font-medium rounded transition-all duration-200 relative",
                        "hover:scale-105 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40",
                        !isCurrentMonth && "text-gray-300 hover:text-gray-400",
                        isCurrentMonth && !isSelected && !isInRangeDay && !isDisabled && "text-gray-700 hover:bg-blue-50",
                        isToday && !isSelected && "ring-2 ring-blue-300 bg-blue-50",
                        isSelected && "bg-blue-500 text-white shadow-md scale-105",
                        isInRangeDay && !isSelected && "bg-blue-100 text-blue-700",
                        isDisabled && "bg-gray-100 text-gray-400",
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
            ))}
          </div>
        </div>
      </div>

      {/* Options Panel - DevExpress Style */}
      <div className="w-80 bg-gray-50 border-l p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Opções</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Selection Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Modo de Seleção</label>
          <Select value={selectionMode} onValueChange={(value: SelectionMode) => {
            setSelectionMode(value);
            clearSelection();
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Única</SelectItem>
              <SelectItem value="multiple">Múltipla</SelectItem>
              <SelectItem value="range">Período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Week Selection */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Selecionar semana ao clicar</label>
          <Switch
            checked={selectWeekOnClick}
            onCheckedChange={(checked) => {
              setSelectWeekOnClick(checked);
              clearSelection();
            }}
          />
        </div>

        {/* Show Week Numbers */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Mostrar números da semana</label>
          <Switch
            checked={showWeekNumbers}
            onCheckedChange={setShowWeekNumbers}
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-800">Disponibilidade de Datas</h4>
          
          {/* Min Date */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Definir data mínima</label>
            <Switch
              checked={hasMinDate}
              onCheckedChange={setHasMinDate}
            />
          </div>

          {/* Max Date */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Definir data máxima</label>
            <Switch
              checked={hasMaxDate}
              onCheckedChange={setHasMaxDate}
            />
          </div>

          {/* Disable Weekends */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Desabilitar fins de semana</label>
            <Switch
              checked={disableWeekends}
              onCheckedChange={setDisableWeekends}
            />
          </div>
        </div>

        {/* Clear Button */}
        <div className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={clearSelection}
            className="w-full"
          >
            Limpar Seleção
          </Button>
        </div>

        {/* Quick Selections */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-800">Seleções Rápidas</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDateRangeChange(today, today);
                setSelectedDates([today]);
              }}
              className="w-full text-xs"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lastWeek = addDays(today, -7);
                onDateRangeChange(lastWeek, today);
                setSelectedDates([]);
              }}
              className="w-full text-xs"
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lastMonth = addDays(today, -30);
                onDateRangeChange(lastMonth, today);
                setSelectedDates([]);
              }}
              className="w-full text-xs"
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const startOfCurrentMonth = startOfMonth(today);
                onDateRangeChange(startOfCurrentMonth, today);
                setSelectedDates([]);
              }}
              className="w-full text-xs"
            >
              Este mês
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}