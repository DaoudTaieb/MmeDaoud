import { NextResponse } from "next/server"
import { query, pool } from "@/lib/db" // Import pool for transactions
import type { OkPacket } from "mysql2/promise"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const connection = await pool.getConnection() // Get a connection from the pool
  try {
    await connection.beginTransaction() // Start transaction

    const invoiceId = params.id
    const { clientId, description, date, lines } = await request.json()

    if (!invoiceId || !clientId || !description || !date || !lines || !Array.isArray(lines)) {
      await connection.rollback()
      return NextResponse.json({ error: "Missing required fields or invalid lines format" }, { status: 400 })
    }

    // Update the main invoice details
    const result = await query<OkPacket>(
      "UPDATE invoices SET client_id = ?, description = ?, date = ? WHERE id = ?",
      [clientId, description, date, invoiceId],
      connection, // Pass the connection
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return NextResponse.json({ error: "Invoice not found or no changes made" }, { status: 404 })
    }

    // Delete existing invoice lines for this invoice
    await query<OkPacket>("DELETE FROM invoice_lines WHERE invoice_id = ?", [invoiceId], connection)

    // Insert new/updated invoice lines
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
    return NextResponse.json({ success: true, message: "Invoice updated successfully" })
  } catch (error: any) {
    await connection.rollback() // Rollback on error
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice", details: error.message }, { status: 500 })
  } finally {
    connection.release() // Release the connection back to the pool
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Deleting the invoice will cascade delete its lines due to ON DELETE CASCADE
    const result = await query<OkPacket>("DELETE FROM invoices WHERE id = ?", [invoiceId])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Failed to delete invoice", details: error.message }, { status: 500 })
  }
}
