import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
import type { Goal, BankAccount } from "@shared/schema";

interface GoalWithProgress extends Goal {
  progress: number;
  accounts: BankAccount[];
}

interface GoalsOverviewProps {
  onCreateGoal: () => void;
}

export function GoalsOverview({ onCreateGoal }: GoalsOverviewProps) {
  const { data: goals = [], isLoading } = useQuery<GoalWithProgress[]>({
    queryKey: ["/api/goals"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Metas Financeiras</CardTitle>
            <Button onClick={onCreateGoal} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Meta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Metas Financeiras</CardTitle>
          <Button onClick={onCreateGoal} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nova Meta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma meta criada ainda</p>
            <p className="text-sm">Defina suas metas financeiras para acompanhar seu progresso</p>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => (
              <div key={goal.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <i 
                        className={`${goal.icon} text-sm`}
                        style={{ color: goal.color }}
                      ></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  {goal.isCompleted && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>Concluída</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                    </span>
                    <span className="text-sm font-bold" style={{ color: goal.color }}>
                      {goal.progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={goal.progress} 
                    className="h-2"
                    style={{
                      '--progress-foreground': goal.color
                    } as React.CSSProperties}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {goal.targetDate && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Meta: {formatDate(goal.targetDate)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="flex -space-x-1">
                      {goal.accounts.slice(0, 3).map((account, index) => (
                        <div
                          key={account.id}
                          className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                          style={{ backgroundColor: account.color, zIndex: 3 - index }}
                          title={account.name}
                        >
                          {account.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs">
                      {goal.accounts.length === 1 
                        ? goal.accounts[0].name
                        : `${goal.accounts.length} contas vinculadas`
                      }
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Faltam {formatCurrency(parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount))} para atingir a meta
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}