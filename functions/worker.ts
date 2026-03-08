// Cloudflare Worker entry point
// Handles API routes and delegates static assets to the ASSETS binding

interface Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  BUYERS_KV: KVNamespace;
  ASSETS: Fetcher;
}

interface BuyerAccount {
  id: string;
  username: string;
  password: string;
  note: string;
  createdAt: string;
  isActive: boolean;
}

const KV_KEY = "buyers";
const JSON_HEADERS = { "Content-Type": "application/json" };

async function getBuyers(kv: KVNamespace): Promise<BuyerAccount[]> {
  const json = await kv.get(KV_KEY);
  return json ? JSON.parse(json) : [];
}

async function saveBuyers(kv: KVNamespace, buyers: BuyerAccount[]): Promise<void> {
  await kv.put(KV_KEY, JSON.stringify(buyers));
}

function checkAdmin(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authHeader.slice(6));
    const [username, password] = decoded.split(":");
    const adminUsername = env.ADMIN_USERNAME || "admin";
    return !!env.ADMIN_PASSWORD && username === adminUsername && password === env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, message: "Invalid request body" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { username, password } = body;

  if (!username || !password) {
    return new Response(
      JSON.stringify({ success: false, message: "Username and password are required" }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  // 管理者ログインチェック
  const adminUsername = env.ADMIN_USERNAME || "admin";
  const adminPassword = env.ADMIN_PASSWORD;

  if (adminPassword && username === adminUsername && password === adminPassword) {
    return new Response(JSON.stringify({ success: true, isAdmin: true, username }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  }

  // 購入者ログインチェック（KV）
  try {
    const buyers = await getBuyers(env.BUYERS_KV);
    const buyer = buyers.find((b) => b.username === username && b.password === password && b.isActive);
    if (buyer) {
      return new Response(JSON.stringify({ success: true, isAdmin: false, username }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    }
  } catch {
    console.error("KV read error during buyer login");
  }

  return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

async function handleBuyers(request: Request, env: Env): Promise<Response> {
  // 管理者認証チェック
  if (!checkAdmin(request, env)) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const method = request.method;

  // GET /api/buyers — 購入者一覧取得
  if (method === "GET") {
    const buyers = await getBuyers(env.BUYERS_KV);
    return new Response(JSON.stringify({ success: true, buyers }), { headers: JSON_HEADERS });
  }

  // POST /api/buyers — 購入者追加
  if (method === "POST") {
    let body: { username?: string; password?: string; note?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid request body" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const { username, password, note } = body;
    if (!username?.trim() || !password?.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: "Username and password are required" }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const buyers = await getBuyers(env.BUYERS_KV);

    if (buyers.some((b) => b.username === username.trim())) {
      return new Response(JSON.stringify({ success: false, message: "Username already exists" }), {
        status: 409,
        headers: JSON_HEADERS,
      });
    }

    const newBuyer: BuyerAccount = {
      id: `buyer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: username.trim(),
      password: password.trim(),
      note: note?.trim() || "",
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    buyers.push(newBuyer);
    await saveBuyers(env.BUYERS_KV, buyers);

    return new Response(JSON.stringify({ success: true, buyer: newBuyer }), { headers: JSON_HEADERS });
  }

  // PUT /api/buyers — 購入者更新
  if (method === "PUT") {
    let body: { id?: string; username?: string; password?: string; note?: string; isActive?: boolean };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid request body" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Buyer ID is required" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const buyers = await getBuyers(env.BUYERS_KV);
    const index = buyers.findIndex((b) => b.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({ success: false, message: "Buyer not found" }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    if (body.username?.trim()) buyers[index].username = body.username.trim();
    if (body.password?.trim()) buyers[index].password = body.password.trim();
    if (body.note !== undefined) buyers[index].note = body.note.trim();
    if (body.isActive !== undefined) buyers[index].isActive = body.isActive;

    await saveBuyers(env.BUYERS_KV, buyers);

    return new Response(JSON.stringify({ success: true, buyer: buyers[index] }), { headers: JSON_HEADERS });
  }

  // DELETE /api/buyers — 購入者削除
  if (method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Buyer ID is required" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const buyers = await getBuyers(env.BUYERS_KV);
    const filtered = buyers.filter((b) => b.id !== id);

    if (filtered.length === buyers.length) {
      return new Response(JSON.stringify({ success: false, message: "Buyer not found" }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    await saveBuyers(env.BUYERS_KV, filtered);

    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
    status: 405,
    headers: JSON_HEADERS,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API routes
    if (url.pathname === "/api/auth/login") {
      return handleLogin(request, env);
    }

    if (url.pathname === "/api/buyers") {
      return handleBuyers(request, env);
    }

    // All other routes: serve static assets (SPA)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
