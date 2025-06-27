import { useState, useEffect, useRef, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense } from "@shared/schema";

interface DescriptionInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

export const DescriptionInput = forwardRef<HTMLInputElement, DescriptionInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [topSuggestions, setTopSuggestions] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch user's expense history for suggestions
    const { data: expenses = [] } = useQuery<Expense[]>({
      queryKey: ["/api/expenses"],
    });

    // Calculate top 5 most used descriptions and create suggestion list
    useEffect(() => {
      if (expenses.length === 0) return;

      // Count frequency of descriptions
      const descriptionCounts = expenses.reduce((acc, expense) => {
        const desc = expense.description.trim();
        if (desc) {
          acc[desc] = (acc[desc] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get top 5 most used descriptions
      const sortedDescriptions = Object.entries(descriptionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([desc]) => desc);

      setTopSuggestions(sortedDescriptions);

      // Update filtered suggestions based on current input
      const allDescriptions = Object.keys(descriptionCounts);
      updateFilteredSuggestions(value, sortedDescriptions, allDescriptions);
    }, [expenses, value]);

    const updateFilteredSuggestions = (inputValue: string, top5: string[], allDescriptions: string[]) => {
      if (!inputValue.trim()) {
        setFilteredSuggestions(top5);
        return;
      }

      const filtered = allDescriptions
        .filter(desc => 
          desc.toLowerCase().includes(inputValue.toLowerCase()) &&
          desc.toLowerCase() !== inputValue.toLowerCase()
        )
        .slice(0, 8); // Limit to 8 suggestions

      setFilteredSuggestions(filtered);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange?.(newValue);
      
      const uniqueDescriptions = expenses.map(exp => exp.description.trim()).filter(Boolean);
      const allDescriptions = uniqueDescriptions.filter((desc, index) => uniqueDescriptions.indexOf(desc) === index);
      updateFilteredSuggestions(newValue, topSuggestions, allDescriptions);
      setIsOpen(true);
    };

    const handleSuggestionClick = (suggestion: string) => {
      onChange?.(suggestion);
      setIsOpen(false);
    };

    const handleInputFocus = () => {
      setIsOpen(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showingTopSuggestions = !value.trim() && topSuggestions.length > 0;

    return (
      <div ref={containerRef} className="relative">
        <Input
          {...props}
          ref={ref}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={className}
        />
        
        {isOpen && (filteredSuggestions.length > 0 || showingTopSuggestions) && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {showingTopSuggestions && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  Mais utilizadas
                </div>
                {topSuggestions.map((suggestion, index) => (
                  <button
                    key={`top-${index}`}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span>{suggestion}</span>
                    <Badge variant="secondary" className="text-xs">
                      Frequente
                    </Badge>
                  </button>
                ))}
              </>
            )}
            
            {!showingTopSuggestions && filteredSuggestions.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  Sugestões
                </div>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`filtered-${index}`}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </>
            )}
            
            {value.trim() && filteredSuggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma sugestão encontrada. Digite uma nova descrição.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

DescriptionInput.displayName = "DescriptionInput";