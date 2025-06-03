// app/api/user/route.js
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { username, role } = body;

  const { error } = await supabase.from("USER").insert([
    { id: user.id, username, role }
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: "User profile saved" }), { status: 200 });
}
