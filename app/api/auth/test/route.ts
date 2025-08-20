import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Test de connexion à la base de données
    console.log("Testing database connection...")

    const users = await query("SELECT * FROM users WHERE username = 'admin'")
    console.log("Users found:", users)

    if (Array.isArray(users) && users.length > 0) {
      const user = users[0] as any
      console.log("Admin user exists:", { id: user.id, username: user.username })

      // Test du mot de passe
      const testPassword = "admin123"
      const isValid = await bcrypt.compare(testPassword, user.password)
      console.log("Password test result:", isValid)

      return NextResponse.json({
        success: true,
        userExists: true,
        passwordValid: isValid,
        userInfo: { id: user.id, username: user.username },
      })
    } else {
      return NextResponse.json({
        success: true,
        userExists: false,
        message: "Admin user not found",
      })
    }
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
