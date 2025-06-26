import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Expense, Category, BankAccount } from "@shared/schema";

export function ExpenseChart() {
  const [period, setPeriod] = useState("30");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const chartData = useMemo(() => {
    if (!expenses.length || !categories.length || !accounts.length) return [];

    // Filter to only show expenses from active accounts
    const activeAccountIds = accounts
      .filter(account => account.isActive !== false)
      .map(account => account.id);

    // Filter expenses by period and active accounts
    let startDate: Date;
    let endDate: Date = new Date();
    
    if (period === "custom" && customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const now = new Date();
      const periodDays = parseInt(period);
      startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    }
    
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && 
             expenseDate <= endDate && 
             activeAccountIds.includes(expense.accountId);
    });

    // Group by category
    const categoryTotals = new Map<number, number>();
    filteredExpenses.forEach(expense => {
      const current = categoryTotals.get(expense.categoryId) || 0;
      categoryTotals.set(expense.categoryId, current + parseFloat(expense.amount));
    });

    // Calculate total
    const total = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);

    // Create chart data
    return Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          name: category?.name || 'Desconhecida',
          amount,
          percentage: total > 0 ? (amount / total * 100).toFixed(0) : '0',
          color: category?.color || '#6B7280'
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, categories, accounts, period, customStartDate, customEndDate]);

  const applyCustomFilter = () => {
    if (customStartDate && customEndDate) {
      setPeriod("custom");
      setShowAdvancedFilter(false);
    }
  };

  const resetFilter = () => {
    setPeriod("30");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  };

  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="lg:col-span-2 shadow-sm border-gray-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Despesas por Categoria</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                {period === "custom" && (
                  <SelectItem value="custom">
                    Período personalizado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Dialog open={showAdvancedFilter} onOpenChange={setShowAdvancedFilter}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" aria-describedby="dialog-description">
                <DialogHeader>
                  <DialogTitle>Filtro Avançado - Período Personalizado</DialogTitle>
                </DialogHeader>
                <p id="dialog-description" className="text-sm text-gray-600 mb-4">
                  Selecione as datas de início e fim para filtrar as despesas por um período específico.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Início</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customStartDate}
                            onSelect={setCustomStartDate}
                            locale={ptBR}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={2020}
                            toYear={2030}
                            showOutsideDays={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Fim</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customEndDate}
                            onSelect={setCustomEndDate}
                            locale={ptBR}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={2020}
                            toYear={2030}
                            showOutsideDays={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={resetFilter}>
                      Limpar Filtros
                    </Button>
                    <Button 
                      onClick={applyCustomFilter}
                      disabled={!customStartDate || !customEndDate}
                    >
                      Aplicar Filtro
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {period === "custom" && customStartDate && customEndDate && (
          <p className="text-sm text-gray-600">
            Período: {format(customStartDate, "dd/MM/yyyy", { locale: ptBR })} - {format(customEndDate, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Simple pie chart representation */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
          {chartData.length > 0 ? (
            <div className="w-48 h-48 rounded-full relative" style={{
              background: `conic-gradient(${chartData.map((item, index) => {
                const startAngle = chartData.slice(0, index).reduce((sum, prev) => sum + (prev.amount / total * 360), 0);
                const endAngle = startAngle + (item.amount / total * 360);
                return `${item.color} ${startAngle}deg ${endAngle}deg`;
              }).join(', ')})`
            }}>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-lg">Nenhuma despesa encontrada</p>
              <p className="text-sm">Adicione algumas despesas para ver o gráfico</p>
            </div>
          )}
        </div>
        
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {chartData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-600">
                    {formatCurrency(item.amount)} ({item.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
