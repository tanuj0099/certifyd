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

  if (name.length < 2 || name.length > 200) {
    return Response.json({ error: "Please enter a valid name" }, { status: 400 });
  }

  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Waitlist signup requires Supabase URL and publishable key environment variables");
    return Response.json({ error: "Waitlist signup is temporarily unavailable" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase
    .from("Website_Waitlist")
    .insert({ name, email });

  if (error) {
    console.error("Could not save waitlist signup", error);

    if (error.code === "23505") {
      return Response.json({ error: "This email is already on the waitlist" }, { status: 409 });
    }

    if (error.code === "42501") {
      return Response.json(
        { error: "The waitlist database is not configured to accept signups yet" },
        { status: 503 },
      );
    }

    return Response.json({ error: "Could not save your signup. Please try again" }, { status: 500 });
  }

  return Response.json({ success: true });
}
