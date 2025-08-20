import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    let sql = "SELECT * FROM employees"
    const params: any[] = []

    if (type) {
      sql += " WHERE type = ?"
      params.push(type)
    }

    const employees = await query(sql, params)
    return NextResponse.json(employees)
  } catch (error) {
    console.error("Fetch employees error:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await query("DELETE FROM employees WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const { nom, prenom, telephone, type, Salaire } = await request.json()

    const result = await query("INSERT INTO employees (nom, prenom, telephone, type, salaire) VALUES (?, ?, ?, ?, ?)", [
      nom,
      prenom,
      telephone,
      type,
      Salaire || null,
    ])

    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error("Create employee error:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
