import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketingPlanApi } from '../api/marketingPlanApi';

export function useMarketingPlans() {
  return useQuery({
    queryKey: ['marketing-plans'],
    queryFn: marketingPlanApi.list,
  });
}

export function useMarketingPlan(id) {
  return useQuery({
    queryKey: ['marketing-plans', id],
    queryFn: () => marketingPlanApi.getById(id),
    enabled: !!id,
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketingPlanApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-access'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useSavePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => marketingPlanApi.save(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-plans'] }),
  });
}

export function useReviewPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => marketingPlanApi.review(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-plans'] }),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketingPlanApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-plans'] }),
  });
}

export function useGeneratePost() {
  return useMutation({
    mutationFn: marketingPlanApi.generatePost,
  });
}

export function useGeneratePostWithImage() {
  return useMutation({
    mutationFn: marketingPlanApi.generatePostWithImage,
  });
}

export function useRefinePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, instruction }) => marketingPlanApi.refine(id, { instruction }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-plans'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['marketing-plans', String(variables.id)] });
      }
    },
  });
}

export function useGenerateImagePrompt() {
  return useMutation({
    mutationFn: marketingPlanApi.generateImagePrompt,
  });
}

export function useGenerateSocialImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketingPlanApi.generateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
  });
}

