"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Calculator, Building } from "lucide-react"
import Image from "next/image"   // ✅ Import obligatoire

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    salaryEmployees: 0,
    meterEmployees: 0,
    totalClients: 0,
    attendanceRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const employeesResponse = await fetch("/api/employees")
        const employees = await employeesResponse.json()

        const clientsResponse = await fetch("/api/clients")
        const clients = await clientsResponse.json()

        const currentDate = new Date()
        const attendanceResponse = await fetch(
          `/api/attendance?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`
        )
        const attendance = await attendanceResponse.json()

        const salaryEmployees = employees.filter((emp) => emp.type === "Salaire_journalier")
        const meterEmployees = employees.filter((emp) => emp.type === "metre")

        const totalWorkingDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
        const totalPossibleAttendance = salaryEmployees.length * totalWorkingDays
        const actualAttendance = attendance.filter((att) => att.present).length
        const attendanceRate =
          totalPossibleAttendance > 0 ? Math.round((actualAttendance / totalPossibleAttendance) * 100) : 0

        setStats({
          totalEmployees: employees.length,
          salaryEmployees: salaryEmployees.length,
          meterEmployees: meterEmployees.length,
          totalClients: clients.length,
          attendanceRate,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <Layout currentPath="/dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Chargement des statistiques...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentPath="/dashboard">
      <div className="flex justify-center items-center ">
  <Image
    src="/MmeDaoud.jpg"   // ✅ Pas besoin de mettre /public
    alt="Logo"
    width={120}
    height={120}
    className="rounded-full shadow-md"
  />
</div>


      <div className="space-y-6 px-4 py-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de votre pâtisserie Mme Daoud</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-blue-100">Employés actifs</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques du Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de présence</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{stats.attendanceRate}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Employés journaliers</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${stats.totalEmployees > 0 ? (stats.salaryEmployees / stats.totalEmployees) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.salaryEmployees}/{stats.totalEmployees}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Résumé Rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stats.totalEmployees} employés au total</p>
                    <p className="text-xs text-gray-500">Répartis entre Salaire_journaliers et mètre</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Présence à {stats.attendanceRate}%</p>
                    <p className="text-xs text-gray-500">Pour les employés journaliers</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
