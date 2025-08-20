import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const clients = await query("SELECT * FROM clients ORDER BY created_at DESC")
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Fetch clients error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { nom, prenom, telephone, adresse } = await request.json()

    const result = await query("INSERT INTO clients (nom, prenom, telephone, adresse) VALUES (?, ?, ?, ?)", [
      nom,
      prenom,
      telephone,
      adresse,
    ])

    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error("Create client error:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
