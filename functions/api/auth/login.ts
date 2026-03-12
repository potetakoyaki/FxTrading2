interface BuyerAccount {
  id: string;
  username: string;
  password: string;
  note: string;
  createdAt: string;
  isActive: boolean;
  expiresAt: string | null;
}

interface Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  BUYERS_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env } = context;
  const headers = { "Content-Type": "application/json" };

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid request body" }),
      { status: 400, headers }
    );
  }

  const { username, password } = body;

  if (!username || !password) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Username and password are required",
      }),
      { status: 400, headers }
    );
  }

  // 管理者ログインチェック
  const adminUsername = env.ADMIN_USERNAME || "admin";
  const adminPassword = env.ADMIN_PASSWORD;

  if (
    adminPassword &&
    username === adminUsername &&
    password === adminPassword
  ) {
    return new Response(
      JSON.stringify({ success: true, isAdmin: true, username }),
      { status: 200, headers }
    );
  }

  // 購入者ログインチェック（KV）
  try {
    const buyersJson = await env.BUYERS_KV.get("buyers");
    if (buyersJson) {
      const buyers: BuyerAccount[] = JSON.parse(buyersJson);
      const buyer = buyers.find(
        b => b.username === username && b.password === password && b.isActive
      );
      if (buyer) {
        // Check expiration
        if (buyer.expiresAt) {
          const expiresDate = new Date(buyer.expiresAt);
          if (!isNaN(expiresDate.getTime()) && expiresDate < new Date()) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Account expired",
                expired: true,
              }),
              { status: 200, headers }
            );
          }
        }
        return new Response(
          JSON.stringify({
            success: true,
            isAdmin: false,
            username,
            expiresAt: buyer.expiresAt || null,
          }),
          { status: 200, headers }
        );
      }
    }
  } catch {
    console.error("KV read error during buyer login");
  }

  return new Response(
    JSON.stringify({ success: false, message: "Invalid credentials" }),
    { status: 401, headers }
  );
};
