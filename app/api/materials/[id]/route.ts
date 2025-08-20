import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { stepName, descriptions } = await request.json()
    const stepId = params.id

    console.log("Updating material step:", { stepId, stepName, descriptions })

    // Update step name
    await query("UPDATE material_steps SET name = ? WHERE id = ?", [stepName, stepId])

    // Delete existing descriptions
    await query("DELETE FROM material_descriptions WHERE step_id = ?", [stepId])

    // Add new descriptions
    for (const desc of descriptions) {
      // Ensure quantity and price are numbers, defaulting to 0 if parsing fails or empty
      const quantity = Number.parseFloat(desc.quantity) || 0
      const price = Number.parseFloat(desc.price) || 0

      await query("INSERT INTO material_descriptions (step_id, description, quantity, price) VALUES (?, ?, ?, ?)", [
        stepId,
        desc.description,
        quantity,
        price,
      ])
    }

    return NextResponse.json({ success: true, message: "Étape mise à jour avec succès" })
  } catch (error: any) {
    // Use 'any' for error type to access message property
    console.error("Error updating material step:", error)
    return NextResponse.json({ error: "Failed to update material step", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const stepId = params.id

    // Delete descriptions first (foreign key constraint)
    await query("DELETE FROM material_descriptions WHERE step_id = ?", [stepId])

    // Delete the step
    await query("DELETE FROM material_steps WHERE id = ?", [stepId])

    return NextResponse.json({ success: true, message: "Étape supprimée avec succès" })
  } catch (error: any) {
    // Use 'any' for error type to access message property
    console.error("Error deleting material step:", error)
    return NextResponse.json({ error: "Failed to delete material step", details: error.message }, { status: 500 })
  }
}
