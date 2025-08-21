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
          <div className="text-gray-600 text-base sm:text-lg">Chargement...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentPath="/employees/salary">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="space-y-4 sm:space-y-6">
            
            {/* Header Section - Fully Responsive */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="flex-shrink-0">
                    <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                      Employés journaliers
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">
                      Gestion de la présence quotidienne
                    </p>
                  </div>
                </div>

                {/* Calendar Button - Mobile First Design */}
                <div className="flex justify-center sm:justify-end w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-sm sm:text-base px-4 py-3 sm:py-2 font-medium border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                      >
                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {format(selectedDate, "PP", { locale: fr })}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 mx-2 sm:mx-0 border-2 shadow-xl" 
                      align="end"
                      side="bottom"
                      sideOffset={8}
                      avoidCollisions={true}
                      collisionPadding={16}
                    >
                      <div className="bg-white rounded-lg overflow-hidden">
                        <Calendar 
                          mode="single" 
                          selected={selectedDate} 
                          onSelect={setSelectedDate} 
                          initialFocus 
                          className="rounded-lg border-0 p-3 sm:p-4"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center text-base font-semibold",
                            caption_label: "text-base font-semibold",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-md transition-all",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-gray-500 rounded-md w-8 sm:w-9 font-medium text-xs sm:text-sm",
                            row: "flex w-full mt-2",
                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-green-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-green-50 rounded-md transition-colors text-sm sm:text-base",
                            day_selected: "bg-green-600 text-white hover:bg-green-700 hover:text-white focus:bg-green-600 focus:text-white font-semibold",
                            day_today: "bg-gray-100 text-gray-900 font-semibold",
                            day_outside: "text-gray-400 opacity-50",
                            day_disabled: "text-gray-400 opacity-50",
                            day_range_middle: "aria-selected:bg-green-100 aria-selected:text-green-900",
                            day_hidden: "invisible",
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900 font-bold">
                  Liste des Employés - {format(selectedDate, "PP", { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {employees.length === 0 ? (
                  <div className="text-center py-16 sm:py-20">
                    <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <UserCheck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Aucun employé journalier trouvé
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto">
                      Ajoutez des employés pour commencer à gérer leur présence quotidienne
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {employees.map((employee, index) => (
                      <div
                        key={employee.id}
                        className="group relative bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 hover:border-green-200 hover:shadow-md transition-all duration-300 ease-in-out"
                      >
                        {/* Employee Card Content */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                          
                          {/* Employee Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-bold text-sm sm:text-base">
                                  {employee.nom.charAt(0)}{employee.prenom.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 leading-tight mb-2">
                                  {employee.nom} {employee.prenom}
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0">
                                    <div className="flex items-center text-sm sm:text-base text-gray-600">
                                      <span className="font-semibold text-gray-700 mr-2">Téléphone:</span>
                                      <span className="font-mono bg-gray-50 px-2 py-1 rounded text-sm">
                                        {employee.telephone}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm sm:text-base text-gray-600">
                                      <span className="font-semibold text-gray-700 mr-2">Salaire journalier:</span>
                                      <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm sm:text-base">
                                        {employee.salaire} TND
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Attendance Control - Mobile Optimized */}
                          <div className="flex items-center justify-between lg:justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                            <div className="flex items-center space-x-4 lg:space-x-6">
                              <div className="text-center lg:text-right">
                                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 ${
                                  isPresent(employee.id) 
                                    ? "bg-green-100 text-green-800 border-2 border-green-200" 
                                    : "bg-gray-100 text-gray-600 border-2 border-gray-200"
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    isPresent(employee.id) ? "bg-green-500" : "bg-gray-400"
                                  }`}></div>
                                  {isPresent(employee.id) ? "Présent" : "Absent"}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <Switch
                                  checked={isPresent(employee.id)}
                                  onCheckedChange={(checked) => handleAttendanceToggle(employee.id, checked)}
                                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 scale-125 sm:scale-110 lg:scale-100"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subtle hover effect indicator */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Footer */}
            {employees.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="text-sm sm:text-base text-gray-600">
                    <span className="font-semibold">Total employés:</span> {employees.length}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600">
                    <span className="font-semibold">Présents aujourd'hui:</span>{" "}
                    <span className="font-bold text-green-600">
                      {employees.filter(emp => isPresent(emp.id)).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

