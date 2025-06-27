import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const formatDisplay = (num: number) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    const [displayValue, setDisplayValue] = useState(() => {
      if (!value) return "";
      const numValue = parseFloat(value);
      return isNaN(numValue) ? "" : formatDisplay(numValue);
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove all non-digit characters
      const digits = inputValue.replace(/\D/g, '');
      
      if (digits === '') {
        setDisplayValue('');
        onChange?.('');
        return;
      }

      // Convert to number (cents to reais)
      const numValue = parseInt(digits) / 100;
      const formatted = formatDisplay(numValue);
      
      setDisplayValue(formatted);
      onChange?.(numValue.toString());
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          className={cn("pl-10", className)}
          placeholder="0,00"
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";