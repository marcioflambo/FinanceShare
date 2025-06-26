import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { StatsCards } from "@/components/stats-cards";
import { ExpenseChart } from "@/components/expense-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { AllTransactions } from "@/components/all-transactions";
import { BillSplits } from "@/components/bill-splits";
import { BankAccounts } from "@/components/bank-accounts";
import { GoalsOverview } from "@/components/goals-overview";

import { ExpenseModal } from "@/components/expense-modal";
import { BillSplitModal } from "@/components/bill-split-modal";
import { GoalModal } from "@/components/goal-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Download, Users, Target } from "lucide-react";

export type ActiveSection = 'dashboard' | 'expenses' | 'splits' | 'reports';

export default function Dashboard() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBillSplitModalOpen, setIsBillSplitModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const { data: aiTip } = useQuery<{ tip: string }>({
    queryKey: ["/api/ai-tips"],
  });

  const renderMobileSection = () => {
    if (showAllTransactions) {
      return <AllTransactions onBack={() => setShowAllTransactions(false)} />;
    }

    switch (activeSection) {
      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <ExpenseChart />
              <RecentTransactions onViewAll={() => setShowAllTransactions(true)} />
              <BankAccounts />
            </div>
          </div>
        );
      case 'splits':
        return (
          <div className="space-y-6">
            <BillSplits />
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <GoalsOverview onCreateGoal={() => setIsGoalModalOpen(true)} />
          </div>
        );
      default: // dashboard
        return (
          <>
            <div className="mb-6">
              <StatsCards />
              <div className="mt-4">
                <BankAccounts />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 mb-8">
              <ExpenseChart />
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <i className="fas fa-plus"></i>
                      <span className="font-medium">Despesa</span>
                    </Button>
                    <Button 
                      onClick={() => setIsBillSplitModalOpen(true)}
                      variant="secondary"
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Dividir</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {aiTip && (
                <Card className="shadow-sm border-amber-200 bg-gradient-to-br from-amber-50 to-amber-25">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <h3 className="font-semibold text-gray-900 text-sm">Dica de IA</h3>
                    </div>
                    <p className="text-sm text-gray-700">
                      {aiTip.tip}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: Show filtered content */}
        <div className="md:hidden">
          {renderMobileSection()}
        </div>
        
        {/* Desktop: Show all content */}
        <div className="hidden md:block">
          {showAllTransactions ? (
            <AllTransactions onBack={() => setShowAllTransactions(false)} />
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-start gap-6 mb-4">
                  <div className="flex-1">
                    <StatsCards />
                  </div>
                  <div className="flex-shrink-0">
                    <BankAccounts />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <ExpenseChart />

                <div className="space-y-4">
                  <Card className="shadow-sm border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setIsExpenseModalOpen(true)}
                          className="w-full flex items-center space-x-3 hover:scale-105 transition-transform"
                        >
                          <i className="fas fa-plus"></i>
                          <span className="font-medium">Adicionar Despesa</span>
                        </Button>
                        
                        <Button 
                          onClick={() => setIsBillSplitModalOpen(true)}
                          variant="secondary"
                          className="w-full flex items-center space-x-3 hover:scale-105 transition-transform"
                        >
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Dividir Conta</span>
                        </Button>
                        
                        <Button 
                          onClick={() => setIsGoalModalOpen(true)}
                          variant="outline"
                          className="w-full flex items-center space-x-3 hover:scale-105 transition-transform"
                        >
                          <Target className="w-4 h-4" />
                          <span className="font-medium">Nova Meta</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {aiTip && (
                    <Card className="shadow-sm border-amber-200 bg-gradient-to-br from-amber-50 to-amber-25">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <Lightbulb className="w-5 h-5 text-amber-600" />
                          <h3 className="font-semibold text-gray-900">Dica de IA</h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {aiTip.tip}
                        </p>
                        <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 p-0">
                          Ver mais dicas →
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RecentTransactions onViewAll={() => setShowAllTransactions(true)} />
                <BillSplits />
              </div>

              <div className="mb-8">
                <GoalsOverview onCreateGoal={() => setIsGoalModalOpen(true)} />
              </div>
            </>
          )}
        </div>
      </main>


      
      <ExpenseModal 
        open={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      
      <BillSplitModal 
        open={isBillSplitModalOpen}
        onClose={() => setIsBillSplitModalOpen(false)}
      />
      
      <GoalModal 
        open={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
    </div>
  );
}
