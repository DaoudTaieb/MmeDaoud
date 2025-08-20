import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise"

// GET - Fetch all payments or payments for a specific employee
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employee_id")

    let sql = `
      SELECT p.*, e.nom, e.prenom 
      FROM paymentsEmployee p 
      LEFT JOIN employees e ON p.employee_id = e.id
    `
    let params: any[] = []

    if (employeeId) {
      sql += " WHERE p.employee_id = ?"
      params = [employeeId]
    }

    sql += " ORDER BY p.created_at DESC"

    const payments = await query<RowDataPacket[]>(sql, params)
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments", details: error.message }, { status: 500 })
  }
}

// POST - Create a new payment
export async function POST(request: Request) {
  try {
    const { employee_id, amount, type, note } = await request.json()

    if (!employee_id || !amount || !type) {
      return NextResponse.json({ error: "Employee ID, amount, and type are required" }, { status: 400 })
    }

    if (!["acompte", "salaire"].includes(type)) {
      return NextResponse.json({ error: "Type must be 'acompte' or 'salaire'" }, { status: 400 })
    }

    const result = await query<ResultSetHeader>(
      "INSERT INTO paymentsEmployee (employee_id, amount, type, note) VALUES (?, ?, ?, ?)",
      [employee_id, amount, type, note || null],
    )

    return NextResponse.json(
      {
        id: result.insertId,
        employee_id,
        amount,
        type,
        note,
        message: "Payment created successfully",
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment", details: error.message }, { status: 500 })
  }
}
