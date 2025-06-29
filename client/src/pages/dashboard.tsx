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
import { BillSplitModal } from "@/components/bill-split-modal";
import { GoalModal } from "@/components/goal-modal";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Download, Users, Target } from "lucide-react";

export type ActiveSection = 'dashboard' | 'expenses' | 'splits' | 'reports';
export type TransactionType = 'debit' | 'credit' | 'transfer' | 'recurring';

export default function Dashboard() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBillSplitModalOpen, setIsBillSplitModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>('debit');

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
                      onClick={() => setIsTransactionModalOpen(true)}
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <i className="fas fa-plus text-sm"></i>
                      <span className="text-sm font-medium">Nova Despesa</span>
                    </Button>
                    <Button 
                      onClick={() => setIsTransactionModalOpen(true)}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                    >
                      <i className="fas fa-sync-alt text-sm"></i>
                      <span className="text-sm font-medium">Recorrente</span>
                    </Button>
                    <Button 
                      onClick={() => setIsTransactionModalOpen(true)}
                      variant="secondary"
                      className="flex items-center justify-center space-x-2 hover:scale-105 transition-transform col-span-2"
                    >
                      <i className="fas fa-exchange-alt text-sm"></i>
                      <span className="text-sm font-medium">Transferir</span>
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
                    onTransferClick={() => setIsTransactionModalOpen(true)}
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
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Movimentações</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <Button 
                          onClick={() => {
                            setSelectedTransactionType('debit');
                            setIsTransactionModalOpen(true);
                          }}
                          variant={selectedTransactionType === 'debit' ? 'default' : 'outline'}
                          className={`flex items-center justify-start space-x-3 h-12 px-4 hover:scale-105 transition-all duration-200 ${
                            selectedTransactionType === 'debit' 
                              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md' 
                              : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                          }`}
                        >
                          <i className="fas fa-minus w-4 text-center"></i>
                          <span className="font-medium">Despesa</span>
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedTransactionType('credit');
                            setIsTransactionModalOpen(true);
                          }}
                          variant={selectedTransactionType === 'credit' ? 'default' : 'outline'}
                          className={`flex items-center justify-start space-x-3 h-12 px-4 hover:scale-105 transition-all duration-200 ${
                            selectedTransactionType === 'credit' 
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md' 
                              : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                          }`}
                        >
                          <i className="fas fa-plus w-4 text-center"></i>
                          <span className="font-medium">Receita</span>
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedTransactionType('recurring');
                            setIsTransactionModalOpen(true);
                          }}
                          variant={selectedTransactionType === 'recurring' ? 'default' : 'outline'}
                          className={`flex items-center justify-start space-x-3 h-12 px-4 hover:scale-105 transition-all duration-200 ${
                            selectedTransactionType === 'recurring' 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-md' 
                              : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                          }`}
                        >
                          <i className="fas fa-sync-alt w-4 text-center"></i>
                          <span className="font-medium">Recorrente</span>
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedTransactionType('transfer');
                            setIsTransactionModalOpen(true);
                          }}
                          variant={selectedTransactionType === 'transfer' ? 'default' : 'outline'}
                          className={`flex items-center justify-start space-x-3 h-12 px-4 hover:scale-105 transition-all duration-200 ${
                            selectedTransactionType === 'transfer' 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md' 
                              : 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                          }`}
                        >
                          <i className="fas fa-exchange-alt w-4 text-center"></i>
                          <span className="font-medium">Transferir</span>
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
            </>
          )}
        </div>
      </main>

      <ExpenseModal 
        open={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        preselectedAccountId={selectedAccountIds[0] || undefined}
        preselectedTransactionType={selectedTransactionType === 'recurring' ? 'debit' : selectedTransactionType}
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