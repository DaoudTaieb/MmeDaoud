import { NextResponse } from "next/server"
import { authenticateUser, generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    console.log("=== LOGIN ATTEMPT ===")

    const body = await request.json()
    console.log("Request body:", body)

    const { username, password, rememberMe } = body

    if (!username || !password) {
      console.log("Missing username or password")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    console.log("Attempting to authenticate:", { username, passwordLength: password.length })

    const user = await authenticateUser(username, password)
    console.log("Authentication result:", user)

    if (!user) {
      console.log("Authentication failed - invalid credentials")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("User authenticated successfully:", user)

    const token = generateToken(user.id, rememberMe)
    console.log("Token generated successfully")

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    })

    // Set cookie
    const maxAge = rememberMe ? 5 * 24 * 60 * 60 : 24 * 60 * 60
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: maxAge,
      path: "/",
      sameSite: "lax",
    })

    console.log("Login successful, cookie set")
    return response
  } catch (error) {
    console.error("=== LOGIN ERROR ===", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
