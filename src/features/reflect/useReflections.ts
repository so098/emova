"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as reflectionApi from "@/lib/supabase/reflectionApi";

const REFLECTION_KEY = ["reflections"] as const;

export function useReflections() {
  return useInfiniteQuery({
    queryKey: REFLECTION_KEY,
    queryFn: ({ pageParam }) => reflectionApi.fetchReflectionPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
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
