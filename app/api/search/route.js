// app/api/search/route.js
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const body = await req.json();

  let query = supabase.from("recipe").select("*");

  // Apply filters
  if (body.cuisineType) query = query.eq("cuisine", body.cuisineType);
  if (body.mealType) query = query.eq("meal_type", body.mealType);
  if (body.dietaryPreferences) query = query.contains("dietary_preferences", [body.dietaryPreferences]);
  if (body.cookingDifficulty) query = query.eq("difficulty", body.cookingDifficulty);
  if (body.cookingTime) query = query.lte("preparation_time", body.cookingTime);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ results: data });
}
