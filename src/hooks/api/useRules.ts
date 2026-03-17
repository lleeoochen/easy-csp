import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RulesService } from '../../services/rulesService';
import type { RuleTransformation } from '@easy-csp/shared-types';

export const RULES_QUERY_KEY = ['rules'];

export const useRules = () => {
  return useQuery({
    queryKey: RULES_QUERY_KEY,
    queryFn: () => RulesService.getRules(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: RuleTransformation) => RulesService.addRule(rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY }),
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleIndex, updatedRule }: { ruleIndex: number; updatedRule: RuleTransformation }) =>
      RulesService.updateRule(ruleIndex, updatedRule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY }),
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleIndex: number) => RulesService.deleteRule(ruleIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY }),
  });
};

export const useReorderRules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) =>
      RulesService.reorderRules(fromIndex, toIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY }),
  });
};
