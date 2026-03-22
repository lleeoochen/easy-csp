import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RulesService } from '../../services/rulesService';
import type { RuleTransformation, Rule } from '@easy-csp/shared-types';

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
    onSuccess: (_data, rule) => {
      // Add the new rule to the transformations array
      queryClient.setQueryData<Rule | null>(RULES_QUERY_KEY, (old) => {
        if (!old) return { uid: '', transformations: [rule] };
        return {
          ...old,
          transformations: [...old.transformations, rule],
        };
      });
    },
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleIndex, updatedRule }: { ruleIndex: number; updatedRule: RuleTransformation }) =>
      RulesService.updateRule(ruleIndex, updatedRule),
    onSuccess: (_data, { ruleIndex, updatedRule }) => {
      queryClient.setQueryData<Rule | null>(RULES_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          transformations: old.transformations.map((rule, i) =>
            i === ruleIndex ? updatedRule : rule
          ),
        };
      });
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleIndex: number) => RulesService.deleteRule(ruleIndex),
    onSuccess: (_data, ruleIndex) => {
      queryClient.setQueryData<Rule | null>(RULES_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          transformations: old.transformations.filter((_, i) => i !== ruleIndex),
        };
      });
    },
  });
};

export const useReorderRules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) =>
      RulesService.reorderRules(fromIndex, toIndex),
    onSuccess: (_data, { fromIndex, toIndex }) => {
      queryClient.setQueryData<Rule | null>(RULES_QUERY_KEY, (old) => {
        if (!old) return old;
        const newTransformations = [...old.transformations];
        const [removed] = newTransformations.splice(fromIndex, 1);
        newTransformations.splice(toIndex, 0, removed);
        return {
          ...old,
          transformations: newTransformations,
        };
      });
    },
  });
};
