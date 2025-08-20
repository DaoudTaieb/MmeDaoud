import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { query } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: number, rememberMe = false): string {
  const expiresIn = rememberMe ? "5d" : "1d"
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export async function createUser(username: string, password: string) {
  const hashedPassword = await hashPassword(password)
  const result = await query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword])
  return result
}

export async function authenticateUser(username: string, password: string) {
  try {
    console.log("Authenticating user:", username) // Debug log

    const users = (await query("SELECT * FROM users WHERE username = ?", [username])) as any[]

    console.log("Users found:", users.length) // Debug log

    if (users.length === 0) {
      console.log("No user found with username:", username)
      return null
    }

    const user = users[0]
    console.log("User found, verifying password...") // Debug log

    const isValid = await verifyPassword(password, user.password)
    console.log("Password verification result:", isValid) // Debug log

    if (!isValid) {
      console.log("Invalid password for user:", username)
      return null
    }

    return { id: user.id, username: user.username }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
