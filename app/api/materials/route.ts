import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    const steps = (await query("SELECT * FROM material_steps WHERE client_id = ? ORDER BY created_at", [
      clientId,
    ])) as any[]

    for (const step of steps) {
      const descriptions = await query("SELECT * FROM material_descriptions WHERE step_id = ? ORDER BY created_at", [
        step.id,
      ])
      step.descriptions = descriptions
    }

    return NextResponse.json(steps)
  } catch (error) {
    console.error("Fetch materials error:", error)
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { clientId, stepName, descriptions } = await request.json()

    // Create step
    const stepResult = (await query("INSERT INTO material_steps (client_id, name) VALUES (?, ?)", [
      clientId,
      stepName,
    ])) as any

    const stepId = stepResult.insertId

    // Add descriptions
    for (const desc of descriptions) {
      await query("INSERT INTO material_descriptions (step_id, description, quantity, price) VALUES (?, ?, ?, ?)", [
        stepId,
        desc.description,
        desc.quantity || null,
        desc.price || null,
      ])
    }

    return NextResponse.json({ success: true, stepId })
  } catch (error) {
    console.error("Create material step error:", error)
    return NextResponse.json({ error: "Failed to create material step" }, { status: 500 })
  }
}
