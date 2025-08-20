import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { format } from "date-fns"

export async function POST(request: Request) {
  try {
    const { employeeId, date, present } = await request.json()

    const formattedDate = format(new Date(date), "yyyy-MM-dd")

    // Check if attendance record exists
    const existing = (await query("SELECT * FROM attendance WHERE employee_id = ? AND date = ?", [
      employeeId,
      formattedDate,
    ])) as any[]

    if (existing.length > 0) {
      // Update existing record
      await query("UPDATE attendance SET present = ? WHERE employee_id = ? AND date = ?", [
        present,
        employeeId,
        formattedDate,
      ])
    } else {
      // Insert new record
      await query("INSERT INTO attendance (employee_id, date, present) VALUES (?, ?, ?)", [
        employeeId,
        formattedDate,
        present,
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Attendance error:", error)
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    let sql = "SELECT * FROM attendance WHERE 1=1"
    const params: any[] = []

    if (employeeId) {
      sql += " AND employee_id = ?"
      params.push(employeeId)
    }

    if (month && year) {
      sql += " AND MONTH(date) = ? AND YEAR(date) = ?"
      params.push(month, year)
    }

    const attendance = await query(sql, params)
    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Fetch attendance error:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}
