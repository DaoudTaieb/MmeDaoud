import mysql from "mysql2/promise"
import type { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2/promise"

const dbConfig = {
  host: process.env.DB_HOST
  ,
  port: Number.parseInt(process.env.DB_PORT!)
  ,
  user: process.env.DB_USER 
  ,
  password: process.env.DB_PASSWORD 
  ,
  database: process.env.DB_NAME 
  ,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

console.log("Database config:", {
  ...dbConfig,
  password: dbConfig.password ? "[HIDDEN]" : "[EMPTY]",
})

const pool = mysql.createPool(dbConfig)

// Export the pool directly for transaction management
export { pool }

// Modified query function to optionally accept a connection
// and return a more specific type for results
export async function query<T extends RowDataPacket[] | OkPacket | ResultSetHeader>(
  sql: string,
  values: any[] = [],
  connection?: mysql.PoolConnection,
): Promise<T> {
  try {
    console.log("=== DATABASE QUERY ===")
    console.log("SQL:", sql)
    console.log("Values:", values)

    const executor = connection ? connection : pool
    const [results] = await executor.execute(sql, values)
    console.log("Query successful, rows affected/returned:", Array.isArray(results) ? results.length : "N/A")

    return results as T
  } catch (error) {
    console.error("=== DATABASE ERROR ===")
    console.error("SQL:", sql)
    console.error("Values:", values)
    console.error("Error:", error)
    throw error
  }
}

// Test de connexion au démarrage
export async function testConnection() {
  try {
    const [results] = await pool.execute("SELECT 1 as test")
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}
