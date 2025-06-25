// Utilitário para formatação de moeda

export function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0,00';
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyInput(value: string): string {
  // Remove tudo que não for dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se estiver vazio, retorna 0,00
  if (!numbers) return '0,00';
  
  // Converte para centavos e formata
  const cents = parseInt(numbers);
  const formatted = (cents / 100).toFixed(2).replace('.', ',');
  
  return formatted;
}

export function parseCurrencyInput(formattedValue: string): string {
  return formattedValue.replace(',', '.');
}

export function formatCurrencyDisplay(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return `R$ ${numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}