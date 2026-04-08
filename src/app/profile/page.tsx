import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import getQueryClient from "@/lib/query/getQueryClient";
import { QUEST_KEY, REFLECTION_KEY, ACHIEVEMENTS_KEY, STREAK_KEY } from "@/lib/query/queryKeys";
import {
  prefetchQuests,
  prefetchReflections,
  prefetchUnlockedAchievements,
  prefetchStreak,
} from "@/lib/supabase/serverQueries";
import ProfileContent from "@/features/profile/components/ProfileContent";

export default async function ProfilePage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: QUEST_KEY, queryFn: prefetchQuests }),
    queryClient.prefetchQuery({ queryKey: REFLECTION_KEY, queryFn: prefetchReflections }),
    queryClient.prefetchQuery({ queryKey: ACHIEVEMENTS_KEY, queryFn: prefetchUnlockedAchievements }),
    queryClient.prefetchQuery({ queryKey: STREAK_KEY, queryFn: prefetchStreak }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileContent />
    </HydrationBoundary>
  );
}
