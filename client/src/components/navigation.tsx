import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Wallet } from "lucide-react";
import type { ActiveSection } from "@/pages/dashboard";

interface NavigationProps {
  activeSection?: ActiveSection;
  onSectionChange?: (section: ActiveSection) => void;
}

export function Navigation({ activeSection = 'dashboard', onSectionChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveSection, label: "Dashboard", icon: "fas fa-home" },
    { id: 'expenses' as ActiveSection, label: "Despesas", icon: "fas fa-receipt" },
    { id: 'splits' as ActiveSection, label: "Divisão", icon: "fas fa-users" },
    { id: 'reports' as ActiveSection, label: "Relatórios", icon: "fas fa-chart-line" },
  ];

  const handleSectionChange = (sectionId: ActiveSection) => {
    onSectionChange?.(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-primary">FinanceShare</h1>
            </div>
            
            {/* Desktop navigation - hidden since not needed */}
            <div className="hidden"></div>
            
            <div className="flex items-center space-x-3">
              <button 
                className="p-2 text-gray-600 hover:text-primary transition-colors md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">U</span>
                </div>
                <span className="text-sm font-medium">Usuário Demo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors",
                    activeSection === item.id
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  )}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors",
                activeSection === item.id
                  ? "text-primary"
                  : "text-gray-500 hover:text-primary"
              )}
              onClick={() => handleSectionChange(item.id)}
            >
              <i className={`${item.icon} text-lg`}></i>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}