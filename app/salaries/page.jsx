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
import { Loader2, ArrowLeft, Trash2, CreditCard } from "lucide-react"
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

  return (
    <Layout currentPath="/salaries">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestion des Salaires</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erreur !</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!selectedEmployee ? (
          <Card>
            <CardHeader>
              <CardTitle>Liste des Employés</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEmployees ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Chargement des employés...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Salaire_journalier</TableHead>
                      <TableHead>Reste a Payé</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.nom}</TableCell>
                        <TableCell>{employee.prenom}</TableCell>
                        <TableCell>{employee.telephone}</TableCell>
                        <TableCell>{employee.type === "salaire" ? "Salarié" : "Par Mètre"}</TableCell>
                        <TableCell>{employee.salaire ? `${employee.salaire} TND` : "N/A"}</TableCell>
                        <TableCell>{formatTND(TotalAPayer(employee.id))}</TableCell>
                        <TableCell className="space-x-2">
                          <Button onClick={() => fetchEmployeeHistory(employee.id)} size="sm">
                            Voir Historique
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" onClick={() => setEmployeeToDelete(employee)}>
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
                                <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={deleteEmployee}>Confirmer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">
                  Historique de {selectedEmployee.nom} {selectedEmployee.prenom}
                </CardTitle>
                <div className="flex gap-2">
                  <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                      <Button variant="default">
                        <CreditCard className="mr-2 h-4 w-4" /> Nouveau Paiement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enregistrer un Paiement</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Montant (TND)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.001"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            placeholder="0.000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type de Paiement</Label>
                          <Select
                            value={paymentForm.type}
                            onValueChange={(value) => setPaymentForm({ ...paymentForm, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="acompte">Acompte (Avance)</SelectItem>
                              <SelectItem value="salaire">Paiement de Salaire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="note">Note (optionnel)</Label>
                          <Textarea
                            id="note"
                            value={paymentForm.note}
                            onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                            placeholder="Remarques ou détails supplémentaires..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Annuler
                          </Button>
                          <Button onClick={createPayment}>Enregistrer</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" onClick={handleBackToEmployees}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux Employés
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatTND(employeeTotals[selectedEmployee.id] || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payé</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatTND(employeePaidAmounts[selectedEmployee.id] || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reste à Payer</p>
                    <p className="text-lg font-semibold text-red-600">{formatTND(TotalAPayer(selectedEmployee.id))}</p>
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Chargement de l'historique...</span>
                  </div>
                ) : (
                  <>
                    {selectedEmployee.type === "salaire" && (
                      <div className="mb-4">
                        <p className="text-lg font-semibold">
                          Salaire_journalier Mensuel:{" "}
                          {selectedEmployee.Salaire_journalier ? `${selectedEmployee.Salaire_journalier} TND` : "N/A"}
                        </p>
                        <h3 className="text-xl font-semibold mt-4 mb-2">Historique de Présence</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Présent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {history.length > 0 ? (
                              history.map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>{new Date(record.date).toLocaleDateString("fr-FR")}</TableCell>
                                  <TableCell>{record.present ? "Oui" : "Non"}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                  Aucun historique de présence trouvé.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {selectedEmployee.type === "metre" && (
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold mt-4 mb-2">
                          Historique de Travail par Mètre pour {selectedEmployee.nom} {selectedEmployee.prenom}
                        </h3>
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
                            {history.length > 0 ? (
                              history.map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>{new Date(record.date).toLocaleDateString("fr-FR")}</TableCell>
                                  <TableCell>{record.meters}</TableCell>
                                  <TableCell>{record.price_per_meter} TND</TableCell>
                                  <TableCell>{record.total} TND</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                  Aucun historique de travail par mètre trouvé.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Chargement des paiements...</span>
                  </div>
                ) : (
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
                      {payments.length > 0 ? (
                        payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  payment.type === "acompte"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {payment.type === "acompte" ? "Acompte" : "Salaire"}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">{formatTND(payment.amount)}</TableCell>
                            <TableCell>{payment.note || "-"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            Aucun paiement enregistré.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
