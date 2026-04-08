import PageMain from "@/components/layout/PageMain";
import RecommendList from "@/features/recommend/RecommendList";
import { fetchRecommendations } from "@/app/recommend/actions";

// Zustand는 서버에서 못 읽으니 searchParams로 받음
export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; t?: string }>;
}) {
  const { q = "", t = "" } = await searchParams;
  const questionLabel = decodeURIComponent(q);
  const questionText = decodeURIComponent(t);

  const recommendations = await fetchRecommendations(questionLabel, questionText);

  return (
    <PageMain>
      <RecommendList
        questionLabel={questionLabel}
        questionText={questionText}
        initial={recommendations}
      />
    </PageMain>
  );
}
