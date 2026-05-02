import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import crypto from "crypto";

/* ------------------------------------------------------------------ */
/*  Helper: parse JSON body from raw Node request                     */
/* ------------------------------------------------------------------ */
function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: string) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

/* ------------------------------------------------------------------ */
/*  Vite plugin that serves the payment API during development        */
/* ------------------------------------------------------------------ */
function apiPlugin(_env: Record<string, string>): Plugin {
  // Replit secrets live in process.env, NOT in .env files that loadEnv() reads.
  // Always read server-side secrets directly from process.env here.
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
  // SUPABASE_API_KEY is the actual service role key in this project
  const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

  const PLAN_PRICES: Record<string, number> = {
    premium: 29900,
    platinum: 59900,
  };

  /* ---- Razorpay order creation ---- */
  async function createRazorpayOrder(amount: number) {
    const auth = Buffer.from(
      `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency: "INR", payment_capture: 1 }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        err.error?.description || "Failed to create Razorpay order"
      );
    }
    return response.json();
  }

  /* ---- Supabase plan update ---- */
  async function updateSupabasePlan(
    userId: string,
    plan: string,
    orderId: string,
    paymentId: string
  ) {
    const headers: Record<string, string> = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };

    // Update profiles table
    await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`,
      { method: "PATCH", headers, body: JSON.stringify({ plan }) }
    );

    // Update user metadata
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_metadata: { plan } }),
    });

    // Insert subscription record
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        plan,
        status: "active",
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
      }),
    });
  }

  /* ---- Vite plugin hooks ---- */
  return {
    name: "api-server",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.method !== "POST") return next();

        /* ---------- POST /api/create-order ---------- */
        if (req.url === "/api/create-order") {
          try {
            const body = await parseJsonBody(req);
            const { plan } = body;

            if (!plan || !PLAN_PRICES[plan]) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid plan" }));
              return;
            }

            const amount = PLAN_PRICES[plan];
            const order = await createRazorpayOrder(amount);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: RAZORPAY_KEY_ID,
              })
            );
          } catch (err: any) {
            console.error("create-order error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: err.message || "Internal server error",
              })
            );
          }
          return;
        }

        /* ---------- POST /api/verify-payment ---------- */
        if (req.url === "/api/verify-payment") {
          try {
            const body = await parseJsonBody(req);
            const {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              plan,
              userId,
            } = body;

            if (
              !razorpay_order_id ||
              !razorpay_payment_id ||
              !razorpay_signature ||
              !plan ||
              !userId
            ) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ error: "Missing required fields" })
              );
              return;
            }

            const sigBody = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
              .createHmac("sha256", RAZORPAY_KEY_SECRET)
              .update(sigBody)
              .digest("hex");

            if (expectedSignature !== razorpay_signature) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ error: "Invalid payment signature" })
              );
              return;
            }

            await updateSupabasePlan(
              userId,
              plan,
              razorpay_order_id,
              razorpay_payment_id
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, plan }));
          } catch (err: any) {
            console.error("verify-payment error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: err.message || "Internal server error",
              })
            );
          }
          return;
        }

        /* ---------- POST /api/delete-document ---------- */
        if (req.url === '/api/delete-document') {
          try {
            const body = await parseJsonBody(req);
            const { documentId, userId, filePath } = body;

            if (!documentId || !userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing documentId or userId' }));
              return;
            }

            const baseHeaders: Record<string, string> = {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            };
            const writeHeaders = { ...baseHeaders, Prefer: 'return=minimal' };

            // Verify ownership (no Prefer header so rows are actually returned)
            const checkRes = await fetch(
              `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}&select=id`,
              { headers: baseHeaders }
            );
            if (!checkRes.ok) {
              const err = await checkRes.text();
              throw new Error(`Supabase auth error: ${checkRes.status} ${err}`);
            }
            const rows = await checkRes.json();
            if (!Array.isArray(rows) || rows.length === 0) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Document not found or access denied' }));
              return;
            }

            // Delete from DB
            const delRes = await fetch(
              `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}`,
              { method: 'DELETE', headers: writeHeaders }
            );
            if (!delRes.ok) {
              const errText = await delRes.text();
              throw new Error(`DB delete failed: ${errText}`);
            }

            // Delete from storage (best-effort)
            if (filePath) {
              await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${filePath}`, {
                method: 'DELETE',
                headers: writeHeaders,
              }).catch(() => {});
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            console.error('delete-document error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
          return;
        }

        next();
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Vite config                                                       */
/* ------------------------------------------------------------------ */
export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL .env variables (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      // proxy removed — API is now handled by the plugin above
    },
    plugins: [react(), apiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
