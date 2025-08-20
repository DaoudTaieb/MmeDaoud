import { NextResponse } from "next/server"
import { query, pool } from "@/lib/db" // Import pool for transactions
import type { RowDataPacket, OkPacket } from "mysql2/promise"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    let sql = "SELECT id, client_id, description, date, created_at FROM invoices"
    const params: any[] = []

    if (clientId) {
      sql += " WHERE client_id = ?"
      params.push(clientId)
    }

    sql += " ORDER BY date DESC"

    const invoices = await query<RowDataPacket[]>(sql, params)

    // Fetch invoice lines and payments for each invoice
    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const lines = await query<RowDataPacket[]>(
          "SELECT id, description, quantity, unit_price FROM invoice_lines WHERE invoice_id = ?",
          [invoice.id],
        )
        const payments = await query<RowDataPacket[]>(
          "SELECT id, amount, payment_type, payment_date FROM payments WHERE invoice_id = ?",
          [invoice.id],
        )
        return { ...invoice, lines, payments }
      }),
    )

    return NextResponse.json(invoicesWithDetails)
  } catch (error: any) {
    console.error("Fetch invoices error:", error)
    return NextResponse.json({ error: "Failed to fetch invoices", details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection() // Get a connection from the pool
  try {
    await connection.beginTransaction() // Start transaction

    const { clientId, description, date, lines } = await request.json()

    if (!clientId || !description || !date || !lines || !Array.isArray(lines)) {
      await connection.rollback()
      return NextResponse.json({ error: "Missing required fields or invalid lines format" }, { status: 400 })
    }

    // Insert the main invoice
    const invoiceResult = await query<OkPacket>(
      "INSERT INTO invoices (client_id, description, date) VALUES (?, ?, ?)",
      [clientId, description, date],
      connection, // Pass the connection to use in the transaction
    )

    const invoiceId = invoiceResult.insertId

    // Insert invoice lines
    if (lines.length > 0) {
      const lineValues = lines.map((line: any) => [
        invoiceId,
        line.description,
        Number.parseFloat(line.quantity),
        Number.parseFloat(line.unit_price),
      ])
      // Dynamically construct the INSERT statement for multiple rows
      const placeholders = lineValues.map(() => "(?, ?, ?, ?)").join(", ")
      const flattenedValues = lineValues.flat() // Flatten the array of arrays into a single array

      const insertSql = `INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price) VALUES ${placeholders}`

      await query<OkPacket>(insertSql, flattenedValues, connection)
    }

    await connection.commit() // Commit transaction
    return NextResponse.json({ success: true, id: invoiceId })
  } catch (error: any) {
    await connection.rollback() // Rollback on error
    console.error("Create invoice error:", error)
    return NextResponse.json({ error: "Failed to create invoice", details: error.message }, { status: 500 })
  } finally {
    connection.release() // Release the connection back to the pool
  }
}
