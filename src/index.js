import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { pool } from "./database/db.js";
import auth from "./routes/auth.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { verifySmtpConnection } from "./services/emailService.js";


const app = new Hono();


app.use("*", cors());
app.use("*", secureHeaders());
app.use("*", rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));


app.route("/auth", auth);


app.get("/", async (c) => {
  try {
    const result = await pool.query("SELECT NOW()");

    return c.json({
      message: "Database connected!",
      time: result.rows[0].now,
    });

  } catch (error) {

    console.error(error);

    return c.json({
      message: "Database connection failed",
    }, 500);
  }
});


serve(
  {
    fetch: app.fetch,
    port: process.env.PORT || 3000,
  },
  async () => {
    console.log("Server running at http://localhost:3000");
    await verifySmtpConnection();
  }
);