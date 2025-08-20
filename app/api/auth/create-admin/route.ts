import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    // Supprimer l'utilisateur admin existant
    await query("DELETE FROM users WHERE username = 'admin'")

    // Créer un nouveau hash pour le mot de passe admin123
    const password = "admin123"
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("Creating admin user with password:", password)
    console.log("Hashed password:", hashedPassword)

    // Insérer le nouvel utilisateur
    const result = await query("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hashedPassword])

    console.log("Insert result:", result)

    // Vérifier que l'utilisateur a été créé
    const users = await query("SELECT * FROM users WHERE username = 'admin'")
    console.log("Created user:", users)

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: users[0],
    })
  } catch (error) {
    console.error("Create admin error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
