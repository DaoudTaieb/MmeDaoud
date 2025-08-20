import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { RowDataPacket } from "mysql2/promise"

export async function GET(request: Request, { params }: { params: { employeeId: string } }) {
  try {
    const employeeId = params.employeeId

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    // Fetch ALL employee details, not just the type
    const employeeResult = await query<RowDataPacket[]>("SELECT * FROM employees WHERE id = ?", [employeeId])

    if (employeeResult.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const employeeDetails = employeeResult[0] // This now contains nom, prenom, Salaire_journalier, and type
    const employeeType = employeeDetails.type

    let history: RowDataPacket[] = []

    if (employeeType === "salaire") {
      // Fetch attendance records for salaried employees
      history = await query<RowDataPacket[]>(
        "SELECT id, date, present, created_at FROM attendance WHERE employee_id = ? ORDER BY date DESC",
        [employeeId],
      )
    } else if (employeeType === "metre") {
      // Fetch meter work records for meter-based employees
      history = await query<RowDataPacket[]>(
        "SELECT id, date, meters, price_per_meter, total, created_at FROM meter_work WHERE employee_id = ? ORDER BY date DESC",
        [employeeId],
      )
    } else {
      return NextResponse.json({ error: "Unknown employee type" }, { status: 400 })
    }

    // Return the full employee details along with the history
    return NextResponse.json({ employee: employeeDetails, history })
  } catch (error: any) {
    console.error("Error fetching employee history:", error)
    return NextResponse.json({ error: "Failed to fetch employee history", details: error.message }, { status: 500 })
  }
}
