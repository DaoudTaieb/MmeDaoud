import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    let sql = `
      SELECT d.*, c.nom, c.prenom 
      FROM devis d
      LEFT JOIN clients c ON d.client_id = c.id
      ORDER BY d.created_at DESC
    `
    let params: any[] = []

    if (clientId) {
      sql = `
        SELECT d.*, c.nom, c.prenom 
        FROM devis d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.client_id = ?
        ORDER BY d.created_at DESC
      `
      params = [clientId]
    }

    const result = await query(sql, params)
    const devis = Array.isArray(result) ? result : []

    // Parse JSON articles and ensure numeric values for each devis
    const devisWithParsedArticles = devis.map((d: any) => ({
      ...d,
      articles: d.articles ? JSON.parse(d.articles) : [],
      total_ht: Number.parseFloat(d.total_ht) || 0,
      tva: Number.parseFloat(d.tva) || 0,
      total_ttc: Number.parseFloat(d.total_ttc) || 0,
      validite_jours: Number.parseInt(d.validite_jours) || 30,
    }))

    return NextResponse.json(devisWithParsedArticles)
  } catch (error) {
    console.error("Error fetching devis:", error)
    return NextResponse.json({ error: "Failed to fetch devis" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received devis data:", body)

    const { client_id, titre, description, articles, total_ht, tva, total_ttc, validite_jours } = body

    // Validate required fields
    if (!client_id || !titre || !articles || articles.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = `
      INSERT INTO devis (client_id, titre, description, articles, total_ht, tva, total_ttc, validite_jours, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
    `

    const result = await query(sql, [
      client_id,
      titre,
      description || "",
      JSON.stringify(articles),
      total_ht,
      tva,
      total_ttc,
      validite_jours,
    ])

    console.log("Insert result:", result)

    // Handle different result formats
    let insertId
    if (Array.isArray(result)) {
      insertId = (result as any)[0]?.insertId || (result as any).insertId
    } else {
      insertId = (result as any).insertId
    }

    return NextResponse.json({
      success: true,
      id: insertId,
      message: "Devis créé avec succès",
    })
  } catch (error) {
    console.error("Error creating devis:", error)
    return NextResponse.json(
      {
        error: "Failed to create devis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, statut } = body

    if (!id || !statut) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = "UPDATE devis SET statut = ? WHERE id = ?"
    await query(sql, [statut, id])

    return NextResponse.json({ success: true, message: "Statut mis à jour" })
  } catch (error) {
    console.error("Error updating devis:", error)
    return NextResponse.json({ error: "Failed to update devis" }, { status: 500 })
  }
}
