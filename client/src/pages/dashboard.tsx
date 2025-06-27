import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BankAccount } from "@shared/schema";
import { Navigation } from "@/components/navigation";
import { StatsCards } from "@/components/stats-cards";

import { RecentTransactions } from "@/components/recent-transactions";
import { AllTransactions } from "@/components/all-transactions";
import { BillSplits } from "@/components/bill-splits";
import { BankAccounts } from "@/components/bank-accounts";
import { GoalsOverview } from "@/components/goals-overview";

import { ExpenseModal } from "@/components/expense-modal";
import { AdvancedExpenseModal } from "@/components/advanced-expense-modal";
import { BillSplitModal } from "@/components/bill-split-modal";
import { GoalModal } from "@/components/goal-modal";
import { TransferModal } from "@/components/transfer-modal";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Download, Users, Target } from "lucide-react";

export type ActiveSection = 'dashboard' | 'expenses' | 'splits' | 'reports';

export default function Dashboard() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdvancedExpenseModalOpen, setIsAdvancedExpenseModalOpen] = useState(false);
  const [isBillSplitModalOpen, setIsBillSplitModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  const { data: aiTip } = useQuery<{ tip: string }>({
    queryKey: ["/api/ai-tips"],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  // Initialize filter with the first active account when accounts are loaded
  useEffect(() => {
    if (bankAccounts.length > 0 && selectedAccountIds.length === 0) {
      const firstActiveAccount = bankAccounts.find(account => account.isActive !== false);
      if (firstActiveAccount) {
        setSelectedAccountIds([firstActiveAccount.id]);
      }
    }
  }, [bankAccounts, selectedAccountIds.length]);

  const renderMobileSection = () => {
    if (showAllTransactions) {
      return <AllTransactions 
        onBack={() => setShowAllTransactions(false)} 
        selectedAccountIds={selectedAccountIds}
      />;
    }

    switch (activeSection) {
      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <BankAccounts />
              <RecentTransactions onViewAll={() => setShowAllTransactions(true)} selectedAccountIds={selectedAccountIds} />
            </div>
          </div>
        );
      case 'splits':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <BankAccounts />
              <BillSplits />
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações de Divisão</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={() => setIsBillSplitModalOpen(true)}
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Nova Divisão de Conta</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <BankAccounts />
              <GoalsOverview onCreateGoal={() => setIsGoalModalOpen(true)} />
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações de Relatórios</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={() => setIsGoalModalOpen(true)}
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <Target className="w-4 h-4" />
                      <span className="font-medium">Nova Meta Financeira</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium">Exportar Relatório</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default: // dashboard
        return (
          <>
            <div className="mb-6">
              <BankAccounts />
              <div className="mt-4">
                <StatsCards selectedAccountIds={selectedAccountIds} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 mb-8">
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações de Despesas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <i className="fas fa-plus"></i>
                      <span className="font-medium">Nova Despesa</span>
                    </Button>
                    <Button 
                      onClick={() => setIsAdvancedExpenseModalOpen(true)}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <i className="fas fa-sync-alt"></i>
                      <span className="font-medium">Recorrente</span>
                    </Button>
                    <Button 
                      onClick={() => setIsTransferModalOpen(true)}
                      variant="secondary"
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform col-span-2"
                    >
                      <i className="fas fa-exchange-alt"></i>
                      <span className="font-medium">Transferir entre Contas</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

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
            <AllTransactions 
              onBack={() => setShowAllTransactions(false)} 
              selectedAccountIds={selectedAccountIds}
            />
          ) : (
            <>
              <div className="flex gap-6 mb-4">
                <div className="flex-1 space-y-4">
                  <StatsCards selectedAccountIds={selectedAccountIds} />
                  <RecentTransactions 
                    onViewAll={() => setShowAllTransactions(true)} 
                    selectedAccountIds={selectedAccountIds}
                    onAccountSelectionChange={setSelectedAccountIds}
                  />
                </div>

                <div className="w-80 space-y-4">
                  <BankAccounts 
                    onTransferClick={() => setIsTransferModalOpen(true)}
                    onAccountSelect={(accountId) => {
                      if (accountId) {
                        setSelectedAccountIds([accountId]);
                      } else {
                        setSelectedAccountIds([]);
                      }
                    }}
                    selectedAccountId={selectedAccountIds[0] || null}
                  />

                  <Card className="shadow-sm border-gray-100 w-80">
                    <CardContent className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Navegação Rápida</h3>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => setActiveSection('expenses')}
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center space-x-2 hover:scale-105 transition-transform"
                        >
                          <i className="fas fa-receipt text-sm"></i>
                          <span className="text-sm font-medium">Gerenciar Despesas</span>
                        </Button>
                        
                        <Button 
                          onClick={() => setActiveSection('splits')}
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center space-x-2 hover:scale-105 transition-transform"
                        >
                          <Users className="w-3 h-3" />
                          <span className="text-sm font-medium">Divisão de Contas</span>
                        </Button>
                        
                        <Button 
                          onClick={() => setActiveSection('reports')}
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center space-x-2 hover:scale-105 transition-transform"
                        >
                          <Target className="w-3 h-3" />
                          <span className="text-sm font-medium">Metas e Relatórios</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {aiTip && (
                    <Card className="shadow-sm border-amber-200 bg-gradient-to-br from-amber-50 to-amber-25 w-80">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <h3 className="text-base font-semibold text-gray-900">Dica de IA</h3>
                        </div>
                        <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                          {aiTip.tip}
                        </p>
                        <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 p-0 text-xs">
                          Ver mais dicas →
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Card className="shadow-sm border-gray-100">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral</h3>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setActiveSection('expenses')}>
                        <i className="fas fa-receipt text-blue-600 text-2xl mb-2"></i>
                        <p className="text-sm font-medium text-gray-900">Despesas</p>
                        <p className="text-xs text-gray-600">Gerencie suas transações</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setActiveSection('splits')}>
                        <i className="fas fa-users text-green-600 text-2xl mb-2"></i>
                        <p className="text-sm font-medium text-gray-900">Divisões</p>
                        <p className="text-xs text-gray-600">Divida contas com colegas</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setActiveSection('reports')}>
                        <i className="fas fa-chart-line text-purple-600 text-2xl mb-2"></i>
                        <p className="text-sm font-medium text-gray-900">Relatórios</p>
                        <p className="text-xs text-gray-600">Metas e análises</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      <ExpenseModal 
        open={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      
      <AdvancedExpenseModal 
        open={isAdvancedExpenseModalOpen}
        onClose={() => setIsAdvancedExpenseModalOpen(false)}
      />
      
      <BillSplitModal 
        open={isBillSplitModalOpen}
        onClose={() => setIsBillSplitModalOpen(false)}
      />
      
      <GoalModal 
        open={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />

      <TransferModal 
        open={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
}