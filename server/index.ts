import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON request bodies (required for API endpoints)
  app.use(express.json());

  // Admin credentials from environment variables
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const DEV_BUYERS = [
    {
      username: "takoyaki",
      password: "takoyaki",
      isActive: true,
      expiresAt: null as string | null,
    },
  ];

  // --- API Routes (must be before static files and catch-all) ---

  app.post("/api/auth/login", (_req, res) => {
    const { username, password } = _req.body;

    if (!username || !password) {
      res
        .status(400)
        .json({
          success: false,
          message: "Username and password are required",
        });
      return;
    }

    if (
      username === ADMIN_USERNAME &&
      ADMIN_PASSWORD &&
      password === ADMIN_PASSWORD
    ) {
      res.json({ success: true, isAdmin: true, username });
      return;
    }

    // Local development buyer auth fallback
    const buyer = DEV_BUYERS.find(
      b => b.isActive && b.username === username && b.password === password
    );
    if (buyer) {
      // 利用期限チェック
      if (buyer.expiresAt && new Date(buyer.expiresAt) < new Date()) {
        res.json({
          success: false,
          message: "Account expired",
          expired: true,
        });
        return;
      }
      res.json({
        success: true,
        isAdmin: false,
        username,
        expiresAt: buyer.expiresAt,
      });
      return;
    }

    res.json({ success: false, isAdmin: false, message: "Invalid credentials" });
  });

  // --- Static Files ---

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    if (!ADMIN_PASSWORD) {
      console.warn(
        "⚠ ADMIN_PASSWORD is not set. Admin login will be unavailable."
      );
    }
  });
}

startServer().catch(console.error);
