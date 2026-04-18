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
function apiPlugin(env: Record<string, string>): Plugin {
  const RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

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
