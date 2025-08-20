import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { employeeId, meters, pricePerMeter, date } = await request.json()

    const result = await query(
      "INSERT INTO meter_work (employee_id, meters, price_per_meter, date) VALUES (?, ?, ?, ?)",
      [employeeId, meters, pricePerMeter, date],
    )

    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error("Create meter work error:", error)
    return NextResponse.json({ error: "Failed to save meter work" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    let sql = "SELECT * FROM meter_work WHERE 1=1"
    const params: any[] = []

    if (employeeId) {
      sql += " AND employee_id = ?"
      params.push(employeeId)
    }

    if (month && year) {
      sql += " AND MONTH(date) = ? AND YEAR(date) = ?"
      params.push(month, year)
    }

    sql += " ORDER BY date DESC"

    const meterWork = await query(sql, params)
    return NextResponse.json(meterWork)
  } catch (error) {
    console.error("Fetch meter work error:", error)
    return NextResponse.json({ error: "Failed to fetch meter work" }, { status: 500 })
  }
}
