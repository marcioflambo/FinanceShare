import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccountBalance } from "@shared/schema";

export function useAccountBalance(accountId: number) {
  const queryClient = useQueryClient();

  const { data: balance, isLoading } = useQuery<AccountBalance>({
    queryKey: ['/api/account-balances', accountId],
    enabled: !!accountId,
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/account-balances/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      if (!response.ok) throw new Error('Failed to recalculate balance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-balances', accountId] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
    },
  });

  return {
    balance,
    isLoading,
    recalculate: recalculateMutation.mutate,
    isRecalculating: recalculateMutation.isPending,
  };
}