interface Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { username, password } = body;

  if (!username || !password) {
    return new Response(
      JSON.stringify({ success: false, message: "Username and password are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const adminUsername = env.ADMIN_USERNAME || "admin";
  const adminPassword = env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new Response(
      JSON.stringify({ success: false, message: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (username === adminUsername && password === adminPassword) {
    return new Response(
      JSON.stringify({ success: true, isAdmin: true, username }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, isAdmin: false, message: "Invalid admin credentials" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
