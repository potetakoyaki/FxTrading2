interface BuyerAccount {
  id: string;
  username: string;
  password: string;
  note: string;
  createdAt: string;
  isActive: boolean;
}

interface Env {
  BUYERS_KV: KVNamespace;
}

const KV_KEY = "buyers";
const headers = { "Content-Type": "application/json" };

async function getBuyers(kv: KVNamespace): Promise<BuyerAccount[]> {
  const json = await kv.get(KV_KEY);
  return json ? JSON.parse(json) : [];
}

async function saveBuyers(
  kv: KVNamespace,
  buyers: BuyerAccount[]
): Promise<void> {
  await kv.put(KV_KEY, JSON.stringify(buyers));
}

// GET /api/buyers — 購入者一覧取得
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const buyers = await getBuyers(env.BUYERS_KV);
  return new Response(JSON.stringify({ success: true, buyers }), { headers });
};

// POST /api/buyers — 購入者追加
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { username?: string; password?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid request body" }),
      { status: 400, headers }
    );
  }

  const { username, password, note } = body;
  if (!username?.trim() || !password?.trim()) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Username and password are required",
      }),
      { status: 400, headers }
    );
  }

  const buyers = await getBuyers(env.BUYERS_KV);

  if (buyers.some(b => b.username === username.trim())) {
    return new Response(
      JSON.stringify({ success: false, message: "Username already exists" }),
      { status: 409, headers }
    );
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

  return new Response(JSON.stringify({ success: true, buyer: newBuyer }), {
    headers,
  });
};

// PUT /api/buyers — 購入者更新
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  let body: {
    id?: string;
    username?: string;
    password?: string;
    note?: string;
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid request body" }),
      { status: 400, headers }
    );
  }

  const { id } = body;
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "Buyer ID is required" }),
      { status: 400, headers }
    );
  }

  const buyers = await getBuyers(env.BUYERS_KV);
  const index = buyers.findIndex(b => b.id === id);
  if (index === -1) {
    return new Response(
      JSON.stringify({ success: false, message: "Buyer not found" }),
      { status: 404, headers }
    );
  }

  // 更新対象のフィールドのみ上書き
  if (body.username?.trim()) buyers[index].username = body.username.trim();
  if (body.password?.trim()) buyers[index].password = body.password.trim();
  if (body.note !== undefined) buyers[index].note = body.note.trim();
  if (body.isActive !== undefined) buyers[index].isActive = body.isActive;

  await saveBuyers(env.BUYERS_KV, buyers);

  return new Response(JSON.stringify({ success: true, buyer: buyers[index] }), {
    headers,
  });
};

// DELETE /api/buyers — 購入者削除
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "Buyer ID is required" }),
      { status: 400, headers }
    );
  }

  const buyers = await getBuyers(env.BUYERS_KV);
  const filtered = buyers.filter(b => b.id !== id);

  if (filtered.length === buyers.length) {
    return new Response(
      JSON.stringify({ success: false, message: "Buyer not found" }),
      { status: 404, headers }
    );
  }

  await saveBuyers(env.BUYERS_KV, filtered);

  return new Response(JSON.stringify({ success: true }), { headers });
};
