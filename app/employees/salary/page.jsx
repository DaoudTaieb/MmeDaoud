"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function SalaryEmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendance()
    }
  }, [employees, selectedDate])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees?type=salaire")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `/api/attendance?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`,
      )
      const data = await response.json()

      const attendanceMap = {}
      data.forEach((record) => {
        // Ensure record.date is consistently formatted to yyyy-MM-dd
        const formattedRecordDate = format(new Date(record.date), "yyyy-MM-dd")
        const key = `${record.employee_id}-${formattedRecordDate}`
        attendanceMap[key] = record.present
      })

      setAttendance(attendanceMap)
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const handleAttendanceToggle = async (employeeId, present) => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const key = `${employeeId}-${dateKey}`

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          date: selectedDate.toISOString(),
          present,
        }),
      })

      setAttendance((prev) => ({
        ...prev,
        [key]: present,
      }))
    } catch (error) {
      console.error("Error updating attendance:", error)
    }
  }

  const isPresent = (employeeId) => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const key = `${employeeId}-${dateKey}`
    return attendance[key] || false
  }

  if (loading) {
    return (
      <Layout currentPath="/employees/salary">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentPath="/employees/salary">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employés journaliers</h1>
              <p className="text-gray-600">Gestion de la présence quotidienne</p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedDate, "PP", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Employés - {format(selectedDate, "PP", { locale: fr })}</CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun employé journalier trouvé</div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {employee.nom} {employee.prenom}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Tel: {employee.telephone} | Salaire_journalier: {employee.salaire} TND
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${isPresent(employee.id) ? "text-green-600" : "text-gray-500"}`}>
                        {isPresent(employee.id) ? "Présent" : "Absent"}
                      </span>
                      <Switch
                        checked={isPresent(employee.id)}
                        onCheckedChange={(checked) => handleAttendanceToggle(employee.id, checked)}
                      />
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
