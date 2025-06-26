import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";
import type { Expense, Category, BankAccount } from "@shared/schema";

export function ExpenseChart() {
  const [period, setPeriod] = useState("30");
  
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
    const now = new Date();
    const periodDays = parseInt(period);
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    const filteredExpenses = expenses.filter(expense => 
      new Date(expense.date) >= startDate && 
      activeAccountIds.includes(expense.accountId)
    );

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
  }, [expenses, categories, accounts, period]);

  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="lg:col-span-2 shadow-sm border-gray-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Despesas por Categoria</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
