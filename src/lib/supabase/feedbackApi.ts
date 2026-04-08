import { createClient } from "./client";

export type FeedbackCategory = "bug" | "feature" | "general";

async function getClientId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
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

  if (error) throw error;
}
