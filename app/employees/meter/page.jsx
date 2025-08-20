"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Save } from "lucide-react"

export default function MeterEmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [workData, setWorkData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees?type=metre")
      const data = await response.json()
      setEmployees(data)

      // Initialize work data
      const initialWorkData = {}
      data.forEach((employee) => {
        initialWorkData[employee.id] = {
          meters: "",
          pricePerMeter: "",
          total: 0,
        }
      })
      setWorkData(initialWorkData)
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateWorkData = (employeeId, field, value) => {
    setWorkData((prev) => {
      const updated = { ...prev }
      updated[employeeId] = { ...updated[employeeId], [field]: value }

      // Calculate total
      const meters = Number.parseFloat(updated[employeeId].meters) || 0
      const price = Number.parseFloat(updated[employeeId].pricePerMeter) || 0
      updated[employeeId].total = meters * price

      return updated
    })
  }

  const saveWorkData = async (employeeId) => {
    const workInfo = workData[employeeId]
    if (!workInfo || !workInfo.meters || !workInfo.pricePerMeter) {
      alert("Veuillez remplir tous les champs requis")
      return
    }

    try {
      // You can create a new API endpoint for meter work records
      const response = await fetch("/api/meter-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          meters: Number.parseFloat(workInfo.meters),
          pricePerMeter: Number.parseFloat(workInfo.pricePerMeter),
          date: new Date().toISOString().split("T")[0],
        }),
      })

      if (response.ok) {
        alert("Données sauvegardées avec succès!")
        // Reset the form for this employee
        setWorkData((prev) => ({
          ...prev,
          [employeeId]: {
            meters: "",
            pricePerMeter: "",
            total: 0,
          },
        }))
      } else {
        alert("Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Error saving work data:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  if (loading) {
    return (
      <Layout currentPath="/employees/meter">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentPath="/employees/meter">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Calculator className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Travail par Mètre</h1>
            <p className="text-gray-600">Gestion du travail et calcul des paiements</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saisie du Travail Effectué</CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun employé par mètre trouvé</div>
            ) : (
              <div className="space-y-6">
                {employees.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-4">
                      {employee.nom} {employee.prenom}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Tel: {employee.telephone}</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mètres Travaillés</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={workData[employee.id]?.meters || ""}
                          onChange={(e) => updateWorkData(employee.id, "meters", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prix par Mètre (TND)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={workData[employee.id]?.pricePerMeter || ""}
                          onChange={(e) => updateWorkData(employee.id, "pricePerMeter", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Total (DT)</label>
                        <div className="bg-white border rounded-md px-3 py-2 font-semibold text-green-600">
                          {workData[employee.id]?.total.toFixed(2) || "0.00"}
                        </div>
                      </div>

                      <Button onClick={() => saveWorkData(employee.id)} className="bg-orange-600 hover:bg-orange-700">
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
