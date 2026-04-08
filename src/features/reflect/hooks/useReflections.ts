"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as reflectionApi from "@/lib/supabase/reflectionApi";
import { REFLECTION_KEY } from "@/lib/query/queryKeys";

export function useReflections() {
  return useQuery({
    queryKey: REFLECTION_KEY,
    queryFn: reflectionApi.fetchReflections,
  });
}

export function useInsertReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reflectionApi.insertReflection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REFLECTION_KEY }),
  });
}

export function useUpdateReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...params }: { id: string; beforeEmotion: string; afterEmotion: string; notes: string }) =>
      reflectionApi.updateReflection(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REFLECTION_KEY }),
  });
}

export function useDeleteReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reflectionApi.deleteReflection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REFLECTION_KEY }),
  });
}
