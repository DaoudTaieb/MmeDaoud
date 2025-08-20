"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestDbPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/test")
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: "Failed to test database" })
    }
    setLoading(false)
  }

  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/create-admin", { method: "POST" })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: "Failed to create admin" })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Base de Données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testDatabase} disabled={loading}>
              Tester la DB
            </Button>
            <Button onClick={createAdmin} disabled={loading} variant="outline">
              Créer Admin
            </Button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
