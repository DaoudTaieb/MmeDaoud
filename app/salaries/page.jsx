"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Trash2, CreditCard, User, Phone, DollarSign, Calendar, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function SalariesPage() {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [history, setHistory] = useState([])
  const [payments, setPayments] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [error, setError] = useState(null)
  const [employeeTotals, setEmployeeTotals] = useState({})
  const [employeePaidAmounts, setEmployeePaidAmounts] = useState({})
  const [employeeToDelete, setEmployeeToDelete] = useState(null)

  // Payment form state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "acompte",
    note: "",
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const response = await fetch("/api/employees")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setEmployees(data)
      await calculateAllEmployeeTotals(data)
      await calculateAllEmployeePaidAmounts(data)
    } catch (err) {
      console.error("Failed to fetch employees:", err)
      setError("Failed to load employees. Please try again.")
      toast({
        title: "Erreur",
        description: "Échec du chargement des employés.",
        variant: "destructive",
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  const calculateAllEmployeeTotals = async (employeesList) => {
    const totals = {}

    for (const employee of employeesList) {
      try {
        const response = await fetch(`/api/salaries/history/${employee.id}`)
        if (response.ok) {
          const data = await response.json()
          totals[employee.id] = calculateEmployeeTotal(employee, data.history)
        } else {
          totals[employee.id] = 0
        }
      } catch (err) {
        console.error(`Failed to fetch history for employee ${employee.id}:`, err)
        totals[employee.id] = 0
      }
    }

    setEmployeeTotals(totals)
  }

  const calculateEmployeeTotal = (employee, employeeHistory) => {
    if (!employee || !employeeHistory) return 0

    // Check if employee is salary-based (daily wage)
    if (employee.type === "salaire" || employee.type === "Salarié") {
      const joursPresents = employeeHistory.filter((r) => r.present === 1 || r.present === true).length
      const daily = Number(employee.Salaire_journalier ?? employee.salaire ?? 0)
      return joursPresents * daily
    }

    // Check if employee is meter-based
    if (employee.type === "metre" || employee.type === "Par Mètre") {
      return employeeHistory.reduce((sum, r) => sum + Number(r.total ?? r.meters * r.price_per_meter ?? 0), 0)
    }

    return 0
  }

  const calculateAllEmployeePaidAmounts = async (employeesList) => {
    const paidAmounts = {}

    for (const employee of employeesList) {
      try {
        const response = await fetch(`/api/payments?employee_id=${employee.id}`)
        if (response.ok) {
          const payments = await response.json()
          paidAmounts[employee.id] = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
        } else {
          paidAmounts[employee.id] = 0
        }
      } catch (err) {
        console.error(`Failed to fetch payments for employee ${employee.id}:`, err)
        paidAmounts[employee.id] = 0
      }
    }

    setEmployeePaidAmounts(paidAmounts)
  }

  const TotalAPayer = (employeeId) => {
    const totalEarned = employeeTotals[employeeId] ?? 0
    const totalPaid = employeePaidAmounts[employeeId] ?? 0
    return totalEarned - totalPaid
  }

  const fetchEmployeeHistory = async (employeeId) => {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/salaries/history/${employeeId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setSelectedEmployee(data.employee)
      setHistory(data.history)
      await fetchEmployeePayments(employeeId)
    } catch (err) {
      console.error("Failed to fetch employee history:", err)
      setError("Failed to load history. Please try again.")
      toast({
        title: "Erreur",
        description: "Échec du chargement de l'historique.",
        variant: "destructive",
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchEmployeePayments = async (employeeId) => {
    try {
      setLoadingPayments(true)
      const response = await fetch(`/api/payments?employee_id=${employeeId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setPayments(data)
    } catch (err) {
      console.error("Failed to fetch payments:", err)
      toast({
        title: "Erreur",
        description: "Échec du chargement des paiements.",
        variant: "destructive",
      })
    } finally {
      setLoadingPayments(false)
    }
  }

  const createPayment = async () => {
    if (!selectedEmployee || !paymentForm.amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          amount: Number.parseFloat(paymentForm.amount),
          type: paymentForm.type,
          note: paymentForm.note,
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès.",
      })

      // Reset form and refresh data
      setPaymentForm({ amount: "", type: "acompte", note: "" })
      setShowPaymentDialog(false)
      await fetchEmployeePayments(selectedEmployee.id)
      await calculateAllEmployeePaidAmounts(employees)
    } catch (err) {
      console.error("Failed to create payment:", err)
      toast({
        title: "Erreur",
        description: "Échec de l'enregistrement du paiement.",
        variant: "destructive",
      })
    }
  }

  const deleteEmployee = async () => {
    if (!employeeToDelete) return

    try {
      const response = await fetch(`/api/employees?id=${employeeToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)

      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeToDelete.id))
      setEmployeeTotals((prev) => {
        const newTotals = { ...prev }
        delete newTotals[employeeToDelete.id]
        return newTotals
      })
      setEmployeePaidAmounts((prev) => {
        const newPaidAmounts = { ...prev }
        delete newPaidAmounts[employeeToDelete.id]
        return newPaidAmounts
      })
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès.",
      })
      setEmployeeToDelete(null)
    } catch (err) {
      console.error("Erreur suppression:", err)
      toast({
        title: "Erreur",
        description: "Échec de la suppression de l'employé.",
        variant: "destructive",
      })
    }
  }

  const handleBackToEmployees = () => {
    setSelectedEmployee(null)
    setHistory([])
    setPayments([])
  }

  const isSalarie = (t) => t === "Salarié" || t === "Par Mètre"
  const formatTND = (n) => `${Number(n || 0).toFixed(3)} TND`

  // Mobile Employee Card Component
  const EmployeeCard = ({ employee }) => (
    <Card className="mb-4 border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          {/* Employee Header */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold text-sm">
                {employee.nom.charAt(0)}{employee.prenom.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {employee.nom} {employee.prenom}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Phone className="w-4 h-4 mr-1" />
                <span className="font-mono">{employee.telephone}</span>
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Type:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                employee.type === "salaire" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {employee.type === "salaire" ? "Salarié" : "Par Mètre"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Salaire:</span>
              <span className="font-semibold text-green-600">
                {employee.salaire ? `${employee.salaire} TND` : "N/A"}
              </span>
            </div>
          </div>

          {/* Amount Due */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Reste à payer:</span>
              <span className={`text-lg font-bold ${
                TotalAPayer(employee.id) > 0 ? "text-red-600" : "text-green-600"
              }`}>
                {formatTND(TotalAPayer(employee.id))}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => fetchEmployeeHistory(employee.id)} 
              className="flex-1 min-h-[44px]"
              variant="default"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir Historique
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="sm:w-auto min-h-[44px]" 
                  onClick={() => setEmployeeToDelete(employee)}
                >
                  <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Supprimer</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4 sm:mx-0">
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'employé</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer{" "}
                    <span className="font-bold">
                      {employee.nom} {employee.prenom}
                    </span>{" "}
                    ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel 
                    onClick={() => setEmployeeToDelete(null)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteEmployee}
                    className="w-full sm:w-auto"
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Layout currentPath="/salaries">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Gestion des Salaires
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Gérez les salaires et paiements de vos employés
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg" role="alert">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong className="font-bold">Erreur !</strong> {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!selectedEmployee ? (
            /* Employee List View */
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl text-gray-900">
                  Liste des Employés
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {loadingEmployees ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <span className="text-lg text-gray-600">Chargement des employés...</span>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table - Hidden on Mobile */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Nom</TableHead>
                            <TableHead className="font-semibold">Prénom</TableHead>
                            <TableHead className="font-semibold">Téléphone</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Salaire journalier</TableHead>
                            <TableHead className="font-semibold">Reste à payer</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee) => (
                            <TableRow key={employee.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{employee.nom}</TableCell>
                              <TableCell>{employee.prenom}</TableCell>
                              <TableCell className="font-mono text-sm">{employee.telephone}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  employee.type === "salaire" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {employee.type === "salaire" ? "Salarié" : "Par Mètre"}
                                </span>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {employee.salaire ? `${employee.salaire} TND` : "N/A"}
                              </TableCell>
                              <TableCell>
                                <span className={`font-bold ${
                                  TotalAPayer(employee.id) > 0 ? "text-red-600" : "text-green-600"
                                }`}>
                                  {formatTND(TotalAPayer(employee.id))}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button onClick={() => fetchEmployeeHistory(employee.id)} size="sm">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Historique
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        onClick={() => setEmployeeToDelete(employee)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer l'employé</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer{" "}
                                          <span className="font-bold">
                                            {employee.nom} {employee.prenom}
                                          </span>{" "}
                                          ? Cette action est irréversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>
                                          Annuler
                                        </AlertDialogCancel>
                                        <AlertDialogAction onClick={deleteEmployee}>
                                          Confirmer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards - Shown on Mobile/Tablet */}
                    <div className="lg:hidden space-y-4">
                      {employees.map((employee) => (
                        <EmployeeCard key={employee.id} employee={employee} />
                      ))}
                    </div>

                    {/* Empty State */}
                    {employees.length === 0 && (
                      <div className="text-center py-16">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Aucun employé trouvé
                        </h3>
                        <p className="text-gray-500">
                          Ajoutez des employés pour commencer à gérer leurs salaires
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Employee Detail View */
            <div className="space-y-4 sm:space-y-6">
              {/* Employee Detail Header */}
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold">
                          {selectedEmployee.nom.charAt(0)}{selectedEmployee.prenom.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                          Historique de {selectedEmployee.nom} {selectedEmployee.prenom}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Détails des salaires et paiements
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                        <DialogTrigger asChild>
                          <Button variant="default" className="min-h-[44px]">
                            <CreditCard className="mr-2 h-4 w-4" /> 
                            Nouveau Paiement
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-4 sm:mx-0 max-w-md">
                          <DialogHeader>
                            <DialogTitle>Enregistrer un Paiement</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="amount">Montant (TND)</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.001"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                placeholder="0.000"
                                className="text-base"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="type">Type de Paiement</Label>
                              <Select
                                value={paymentForm.type}
                                onValueChange={(value) => setPaymentForm({ ...paymentForm, type: value })}
                              >
                                <SelectTrigger className="text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="acompte">Acompte (Avance)</SelectItem>
                                  <SelectItem value="salaire">Paiement de Salaire</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note">Note (optionnel)</Label>
                              <Textarea
                                id="note"
                                value={paymentForm.note}
                                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                placeholder="Remarques ou détails supplémentaires..."
                                className="text-base min-h-[80px]"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setShowPaymentDialog(false)}
                                className="w-full sm:w-auto"
                              >
                                Annuler
                              </Button>
                              <Button 
                                onClick={createPayment}
                                className="w-full sm:w-auto"
                              >
                                Enregistrer
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        onClick={handleBackToEmployees}
                        className="min-h-[44px]"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> 
                        Retour aux Employés
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-600">Total Gagné</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatTND(employeeTotals[selectedEmployee.id] ?? 0)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-600">Total Payé</div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatTND(employeePaidAmounts[selectedEmployee.id] ?? 0)}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-600">Reste à Payer</div>
                      <div className="text-2xl font-bold text-orange-900">
                        {formatTND(TotalAPayer(selectedEmployee.id))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">Type</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.type === "salaire" ? "Salarié" : "Par Mètre"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work History */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Historique du Travail</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {loadingHistory ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-600">Chargement de l'historique...</span>
                    </div>
                  ) : (
                    <>
                      {selectedEmployee.type === "salaire" ? (
                        /* Salary Employee History */
                        <div className="space-y-3">
                          {history.length > 0 ? (
                            <>
                              {/* Desktop Table */}
                              <div className="hidden sm:block">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Présent</TableHead>
                                      <TableHead>Salaire Journalier</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {history.map((record, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          {new Date(record.date).toLocaleDateString("fr-FR")}
                                        </TableCell>
                                        <TableCell>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            record.present ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                          }`}>
                                            {record.present ? "Oui" : "Non"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                          {record.present ? `${selectedEmployee.salaire} TND` : "0 TND"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Mobile Cards */}
                              <div className="sm:hidden space-y-3">
                                {history.map((record, index) => (
                                  <Card key={index} className="border border-gray-200">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                          <Calendar className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium">
                                            {new Date(record.date).toLocaleDateString("fr-FR")}
                                          </span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          record.present ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        }`}>
                                          {record.present ? "Présent" : "Absent"}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-lg font-bold text-gray-900">
                                          {record.present ? `${selectedEmployee.salaire} TND` : "0 TND"}
                                        </span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              Aucun historique de présence trouvé.
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Meter-based Employee History */
                        <div className="space-y-3">
                          {history.length > 0 ? (
                            <>
                              {/* Desktop Table */}
                              <div className="hidden sm:block">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Mètres</TableHead>
                                      <TableHead>Prix par Mètre</TableHead>
                                      <TableHead>Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {history.map((record, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          {new Date(record.date).toLocaleDateString("fr-FR")}
                                        </TableCell>
                                        <TableCell className="font-medium">{record.meters}</TableCell>
                                        <TableCell>{record.price_per_meter} TND</TableCell>
                                        <TableCell className="font-bold text-green-600">
                                          {record.total} TND
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Mobile Cards */}
                              <div className="sm:hidden space-y-3">
                                {history.map((record, index) => (
                                  <Card key={index} className="border border-gray-200">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-2">
                                          <Calendar className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium">
                                            {new Date(record.date).toLocaleDateString("fr-FR")}
                                          </span>
                                        </div>
                                        <span className="text-lg font-bold text-green-600">
                                          {record.total} TND
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-gray-600">Mètres:</span>
                                          <span className="font-medium ml-1">{record.meters}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Prix/m:</span>
                                          <span className="font-medium ml-1">{record.price_per_meter} TND</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              Aucun historique de travail par mètre trouvé.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Historique des Paiements</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {loadingPayments ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-600">Chargement des paiements...</span>
                    </div>
                  ) : (
                    <>
                      {payments.length > 0 ? (
                        <>
                          {/* Desktop Table */}
                          <div className="hidden sm:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Montant</TableHead>
                                  <TableHead>Note</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {payments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell>
                                      {new Date(payment.created_at).toLocaleDateString("fr-FR")}
                                    </TableCell>
                                    <TableCell>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        payment.type === "acompte"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}>
                                        {payment.type === "acompte" ? "Acompte" : "Salaire"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="font-semibold text-green-600">
                                      {formatTND(payment.amount)}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {payment.note || "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="sm:hidden space-y-3">
                            {payments.map((payment) => (
                              <Card key={payment.id} className="border border-gray-200">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        {new Date(payment.created_at).toLocaleDateString("fr-FR")}
                                      </span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">
                                      {formatTND(payment.amount)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      payment.type === "acompte"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}>
                                      {payment.type === "acompte" ? "Acompte" : "Salaire"}
                                    </span>
                                  </div>
                                  {payment.note && (
                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      {payment.note}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Aucun paiement enregistré
                          </h3>
                          <p className="text-gray-500">
                            Commencez par enregistrer un paiement pour cet employé
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

