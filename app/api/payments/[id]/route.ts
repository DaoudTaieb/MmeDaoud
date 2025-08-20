import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise"

// GET - Fetch a specific payment
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id

    const payment = await query<RowDataPacket[]>(
      `SELECT p.*, e.nom, e.prenom 
       FROM paymentsEmployee p 
       LEFT JOIN employees e ON p.employee_id = e.id 
       WHERE p.id = ?`,
      [paymentId],
    )

    if (payment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment[0])
  } catch (error: any) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Failed to fetch payment", details: error.message }, { status: 500 })
  }
}

// PUT - Update a payment
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id
    const { amount, type, note } = await request.json()

    if (!amount || !type) {
      return NextResponse.json({ error: "Amount and type are required" }, { status: 400 })
    }

    if (!["acompte", "salaire"].includes(type)) {
      return NextResponse.json({ error: "Type must be 'acompte' or 'salaire'" }, { status: 400 })
    }

    const result = await query<ResultSetHeader>(
      "UPDATE paymentsEmployee SET amount = ?, type = ?, note = ? WHERE id = ?",
      [amount, type, note || null, paymentId],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Payment updated successfully" })
  } catch (error: any) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment", details: error.message }, { status: 500 })
  }
}

// DELETE - Delete a payment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id

    const result = await query<ResultSetHeader>("DELETE FROM paymentsEmployee WHERE id = ?", [paymentId])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Payment deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Failed to delete payment", details: error.message }, { status: 500 })
  }
}
