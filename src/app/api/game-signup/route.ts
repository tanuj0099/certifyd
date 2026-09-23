import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || name.length > 200) {
    return Response.json({ error: "Please enter a valid name" }, { status: 400 });
  }

  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Game signup requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return Response.json({ error: "Signup is temporarily unavailable" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("game_signups").insert({ name, email });

  if (error) {
    console.error("Could not save game signup", error);
    return Response.json({ error: "Could not save your details" }, { status: 500 });
  }

  return Response.json({ success: true });
}
