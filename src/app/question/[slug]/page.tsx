import { notFound } from "next/navigation";
import { QUESTIONS } from "@/constants/questions";
import { decodeQuestionSlug } from "@/utils/questionSlug";
import QuestionDetail from "@/features/question/QuestionDetail";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = decodeQuestionSlug(slug);

  const question = index !== null ? QUESTIONS[index] : undefined;

  if (!question) notFound();

  const { Icon: _, ...serializable } = question;
  return <QuestionDetail question={serializable} />;
}
