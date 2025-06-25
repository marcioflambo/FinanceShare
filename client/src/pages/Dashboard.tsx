import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, DollarSign, TrendingUp, Users, Target } from 'lucide-react';

export function Dashboard() {
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => fetch('/api/statistics').then(res => res.json()),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: () => fetch('/api/expenses').then(res => res.json()),
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: () => fetch('/api/goals').then(res => res.json()),
  });

  if (statsLoading || expensesLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">FinanceShare</h1>
          <p className="text-muted-foreground">Manage your expenses and track your goals</p>
        </div>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${statistics?.totalBalance?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${statistics?.monthlyExpenses?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Splits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${statistics?.pendingSplits?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${statistics?.savings?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.slice(0, 5).map((expense: any) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category?.name} • {expense.account?.name}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium">
                      -${parseFloat(expense.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No expenses recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal: any) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {goal.progress?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${parseFloat(goal.currentAmount || '0').toFixed(2)} of ${parseFloat(goal.targetAmount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No goals set yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}