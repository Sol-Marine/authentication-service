import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { pool } from "./database/db.js";
import auth from "./routes/auth.js";


const app = new Hono();


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
    port: 3000,
  },
  () => {
    console.log("Server running at http://localhost:3000");
  }
);