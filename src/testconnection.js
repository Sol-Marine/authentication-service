import { pool } from "./database/db.js";

const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    
    console.log("Database connected successfully ✅");
    console.log(result.rows);

  } catch (error) {
    console.log("Database connection failed ❌");
    console.log(error.message);
  }
};

testConnection();