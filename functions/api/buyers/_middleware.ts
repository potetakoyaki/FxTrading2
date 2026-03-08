// 購入者管理APIは管理者のみアクセス可能
interface Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  BUYERS_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request, env } = context;
  const headers = { "Content-Type": "application/json" };

  // Authorizationヘッダーから管理者認証情報を取得
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      { status: 401, headers }
    );
  }

  const encoded = authHeader.slice(6);
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid authorization" }),
      { status: 401, headers }
    );
  }

  const [username, password] = decoded.split(":");
  const adminUsername = env.ADMIN_USERNAME || "admin";
  const adminPassword = env.ADMIN_PASSWORD;

  if (
    !adminPassword ||
    username !== adminUsername ||
    password !== adminPassword
  ) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      { status: 401, headers }
    );
  }

  return context.next();
};
