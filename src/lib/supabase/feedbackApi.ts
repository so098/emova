import { createClient } from "./client";
import { authError, dbError } from "@/lib/errors";

export type { FeedbackCategory } from "@/types/feedback";
import type { FeedbackCategory } from "@/types/feedback";

async function getClientId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw authError();
  return user.id;
}

export async function insertFeedback(params: {
  category: FeedbackCategory;
  message: string;
  rating?: number;
}): Promise<void> {
  const supabase = createClient();
  const clientId = await getClientId();

  const { error } = await supabase.from("feedback").insert({
    client_id: clientId,
    category: params.category,
    message: params.message,
    rating: params.rating ?? null,
  });

  if (error) throw dbError(error);
}
