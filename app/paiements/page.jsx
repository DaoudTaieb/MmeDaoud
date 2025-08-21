"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Users, CreditCard, Package, Plus, X, Printer } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [newClient, setNewClient] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
  })

  const [newInvoice, setNewInvoice] = useState({
    description: "",
    date: new Date().toISOString().split("T")[0],
    lines: [{ description: "", quantity: "", unit_price: "" }], // New: Array for invoice lines
  })

  const [newMaterialStep, setNewMaterialStep] = useState({
    stepName: "",
    descriptions: [{ description: "", quantity: "", price: "" }],
  })

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showMaterialDialog, setShowMaterialDialog] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)

  const [editingStep, setEditingStep] = useState(null)
  const [showEditMaterialDialog, setShowEditMaterialDialog] = useState(false)

  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false)
  const [stepToDelete, setStepToDelete] = useState(null)

  const [editingInvoice, setEditingInvoice] = useState(null)
  const [showEditInvoiceDialog, setShowEditInvoiceDialog] = useState(false)

  const [invoiceToDelete, setInvoiceToDelete] = useState(null)
  const [showConfirmDeleteInvoiceDialog, setShowConfirmDeleteInvoiceDialog] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR")
  }

  // Fonction d'impression pour les paiements
  const printInvoices = () => {
    if (!selectedClient || invoices.length === 0) {
      alert("Aucun paiement à imprimer pour ce client.")
      return
    }

    const printWindow = window.open('', '_blank')
    const totalAmount = invoices.reduce((total, invoice) => {
      const invoiceTotal = invoice.lines ? calculateInvoiceLineTotal(invoice.lines) : 0
      return total + invoiceTotal
    }, 0)

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des Paiements - ${selectedClient.prenom} ${selectedClient.nom}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .header { 
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .logo {
            max-height: 80px;
            max-width: 200px;
          }
          .header-text {
            text-align: center;
            flex-grow: 1;
          }
          .header h1 {
            margin: 0;
            color: #2563eb;
          }
          .company-info {
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          .client-info { 
            margin-bottom: 30px; 
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
          }
          .invoice { 
            margin-bottom: 20px; 
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .invoice-header { 
            font-weight: bold; 
            margin-bottom: 10px;
            color: #2563eb;
          }
          .invoice-lines { 
            margin-left: 20px; 
          }
          .invoice-line { 
            margin-bottom: 5px; 
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .total { 
            font-weight: bold; 
            font-size: 18px; 
            text-align: right;
            margin-top: 20px;
            padding: 15px;
            background-color: #e3f2fd;
            border-radius: 5px;
          }
          .print-date {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/STBTP.png" alt="Logo STBTP" class="logo" />
          <div class="header-text">
            <h1>Liste des Paiements</h1>
          </div>
          <div class="company-info">
            <strong>STBTP</strong><br>
            Société de Travaux du Bâtiment<br>
            et Travaux Publics
          </div>
        </div>
        
        <div class="client-info">
          <h2>Informations Client</h2>
          <p><strong>Nom:</strong> ${selectedClient.prenom} ${selectedClient.nom}</p>
          <p><strong>Téléphone:</strong> ${selectedClient.telephone || 'Non renseigné'}</p>
          <p><strong>Adresse:</strong> ${selectedClient.adresse || 'Non renseignée'}</p>
        </div>

        <div class="invoices-list">
          <h2>Détail des Paiements</h2>
          ${invoices.map(invoice => {
            const invoiceTotal = invoice.lines ? calculateInvoiceLineTotal(invoice.lines) : 0
            return `
              <div class="invoice">
                <div class="invoice-header">
                  ${invoice.description} - ${formatDate(invoice.date)}
                </div>
                ${invoice.lines && invoice.lines.length > 0 ? `
                  <div class="invoice-lines">
                    ${invoice.lines.map(line => `
                      <div class="invoice-line">
                        <span>${line.description}</span>
                        <span>${line.quantity} × ${parseFloat(line.unit_price || 0).toFixed(2)}TND = ${(parseFloat(line.quantity || 0) * parseFloat(line.unit_price || 0)).toFixed(2)}TND</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                <div style="text-align: right; margin-top: 10px; font-weight: bold;">
                  Total: ${invoiceTotal.toFixed(2)}TND
                </div>
              </div>
            `
          }).join('')}
        </div>

        <div class="total">
          Total Général: ${totalAmount.toFixed(2)}TND
        </div>

        <div class="print-date">
          Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  // Fonction d'impression pour les matières
  const printMaterials = () => {
    if (!selectedClient || materials.length === 0) {
      alert("Aucune matière à imprimer pour ce client.")
      return
    }

    const printWindow = window.open('', '_blank')
    const totalAmount = materials.reduce((total, material) => {
      const materialTotal = material.descriptions ? calculateStepTotal(material.descriptions) : 0
      return total + materialTotal
    }, 0)

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des Matières - ${selectedClient.prenom} ${selectedClient.nom}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .header { 
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .logo {
            max-height: 80px;
            max-width: 200px;
          }
          .header-text {
            text-align: center;
            flex-grow: 1;
          }
          .header h1 {
            margin: 0;
            color: #16a34a;
          }
          .company-info {
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          .client-info { 
            margin-bottom: 30px; 
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
          }
          .material-step { 
            margin-bottom: 20px; 
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .step-header { 
            font-weight: bold; 
            margin-bottom: 10px;
            color: #16a34a;
          }
          .step-descriptions { 
            margin-left: 20px; 
          }
          .step-description { 
            margin-bottom: 5px; 
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .total { 
            font-weight: bold; 
            font-size: 18px; 
            text-align: right;
            margin-top: 20px;
            padding: 15px;
            background-color: #f0fdf4;
            border-radius: 5px;
          }
          .print-date {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/STBTP.png" alt="Logo STBTP" class="logo" />
          <div class="header-text">
            <h1>Liste des Matières</h1>
          </div>
          <div class="company-info">
            <strong>STBTP</strong><br>
            Société de Travaux du Bâtiment<br>
            et Travaux Publics
          </div>
        </div>
        
        <div class="client-info">
          <h2>Informations Client</h2>
          <p><strong>Nom:</strong> ${selectedClient.prenom} ${selectedClient.nom}</p>
          <p><strong>Téléphone:</strong> ${selectedClient.telephone || 'Non renseigné'}</p>
          <p><strong>Adresse:</strong> ${selectedClient.adresse || 'Non renseignée'}</p>
        </div>

        <div class="materials-list">
          <h2>Détail des Matières</h2>
          ${materials.map(material => {
            const materialTotal = material.descriptions ? calculateStepTotal(material.descriptions) : 0
            return `
              <div class="material-step">
                <div class="step-header">
                  ${material.name}
                </div>
                ${material.descriptions && material.descriptions.length > 0 ? `
                  <div class="step-descriptions">
                    ${material.descriptions.map(desc => `
                      <div class="step-description">
                        <span>${desc.description}</span>
                        <span>${desc.quantity} × ${parseFloat(desc.price || 0).toFixed(2)}TND = ${(parseFloat(desc.quantity || 0) * parseFloat(desc.price || 0)).toFixed(2)}TND</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                <div style="text-align: right; margin-top: 10px; font-weight: bold;">
                  Total: ${materialTotal.toFixed(2)}TND
                </div>
              </div>
            `
          }).join('')}
        </div>

        <div class="total">
          Total Général: ${totalAmount.toFixed(2)}TND
        </div>

        <div class="print-date">
          Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      })

      if (response.ok) {
        fetchClients()
        setNewClient({ nom: "", prenom: "", telephone: "", adresse: "" })
        setShowClientDialog(false)
      }
    } catch (error) {
      console.error("Error adding client:", error)
    }
  }

  const fetchClientData = async (clientId) => {
    try {
      // Fetch invoices
      const invoicesResponse = await fetch(`/api/invoices?clientId=${clientId}`)
      const invoicesData = await invoicesResponse.json()
      setInvoices(invoicesData)

      // Fetch materials
      const materialsResponse = await fetch(`/api/materials?clientId=${clientId}`)
      const materialsData = await materialsResponse.json()
      setMaterials(materialsData)
    } catch (error) {
      console.error("Error fetching client data:", error)
    }
  }

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    fetchClientData(client.id)
  }

  // Invoice Line Management for New Invoice
  const addInvoiceLineField = () => {
    setNewInvoice({
      ...newInvoice,
      lines: [...newInvoice.lines, { description: "", quantity: "", unit_price: "" }],
    })
  }

  const updateNewInvoiceLine = (index, field, value) => {
    const updatedLines = newInvoice.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    setNewInvoice({ ...newInvoice, lines: updatedLines })
  }

  const removeNewInvoiceLine = (index) => {
    if (newInvoice.lines.length > 1) {
      const updatedLines = newInvoice.lines.filter((_, i) => i !== index)
      setNewInvoice({ ...newInvoice, lines: updatedLines })
    }
  }

  const calculateInvoiceLineTotal = (lines) => {
    return lines.reduce((total, line) => {
      const quantity = Number.parseFloat(line.quantity) || 0
      const unit_price = Number.parseFloat(line.unit_price) || 0
      return total + quantity * unit_price
    }, 0)
  }

  const addInvoice = async (e) => {
    e.preventDefault()
    if (!selectedClient) return

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          description: newInvoice.description,
          date: newInvoice.date,
          lines: newInvoice.lines.filter((line) => line.description.trim() !== ""), // Filter out empty lines
        }),
      })

      if (response.ok) {
        fetchClientData(selectedClient.id)
        setNewInvoice({
          description: "",
          date: new Date().toISOString().split("T")[0],
          lines: [{ description: "", quantity: "", unit_price: "" }],
        })
        setShowInvoiceDialog(false)
      } else {
        const errorBody = await response.text()
        console.error("Failed to add invoice. Status:", response.status, "Body:", errorBody)
        try {
          const errorJson = JSON.parse(errorBody)
          alert(`Échec de l'ajout de la facture: ${errorJson.message || errorJson.details || "Erreur inconnue"}`)
        } catch (parseError) {
          alert(`Échec de l'ajout de la facture: ${errorBody}`)
        }
      }
    } catch (error) {
      console.error("Error adding invoice:", error)
      alert("Une erreur réseau est survenue. Veuillez vérifier votre connexion.")
    }
  }

  const editInvoice = (invoice) => {
    setEditingInvoice({
      id: invoice.id,
      description: invoice.description,
      date: new Date(invoice.date).toISOString().split("T")[0],
      lines:
        invoice.lines && invoice.lines.length > 0 ? invoice.lines : [{ description: "", quantity: "", unit_price: "" }],
    })
    setShowEditInvoiceDialog(true)
  }

  // Invoice Line Management for Editing Invoice
  const addEditingInvoiceLineField = () => {
    setEditingInvoice({
      ...editingInvoice,
      lines: [...editingInvoice.lines, { description: "", quantity: "", unit_price: "" }],
    })
  }

  const updateEditingInvoiceLine = (index, field, value) => {
    const updatedLines = editingInvoice.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    setEditingInvoice({ ...editingInvoice, lines: updatedLines })
  }

  const removeEditingInvoiceLine = (index) => {
    if (editingInvoice.lines.length > 1) {
      const updatedLines = editingInvoice.lines.filter((_, i) => i !== index)
      setEditingInvoice({ ...editingInvoice, lines: updatedLines })
    }
  }

  const updateInvoice = async (e) => {
    e.preventDefault()
    if (!selectedClient || !editingInvoice) return

    try {
      const response = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          description: editingInvoice.description,
          date: editingInvoice.date,
          lines: editingInvoice.lines.filter((line) => line.description.trim() !== ""), // Filter out empty lines
        }),
      })

      if (response.ok) {
        fetchClientData(selectedClient.id)
        setEditingInvoice(null)
        setShowEditInvoiceDialog(false)
      } else {
        const errorBody = await response.text()
        console.error("Failed to update invoice. Status:", response.status, "Body:", errorBody)
        try {
          const errorJson = JSON.parse(errorBody)
          alert(`Échec de la mise à jour de la facture: ${errorJson.message || errorJson.details || "Erreur inconnue"}`)
        } catch (parseError) {
          alert(`Échec de la mise à jour de la facture: ${errorBody}`)
        }
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
      alert("Une erreur réseau est survenue. Veuillez vérifier votre connexion.")
    }
  }

  const handleDeleteInvoice = (invoiceId) => {
    setInvoiceToDelete(invoiceId)
    setShowConfirmDeleteInvoiceDialog(true)
  }

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchClientData(selectedClient.id)
        setInvoiceToDelete(null)
        setShowConfirmDeleteInvoiceDialog(false)
      } else {
        const errorBody = await response.text()
        console.error("Failed to delete invoice. Status:", response.status, "Body:", errorBody)
        try {
          const errorJson = JSON.parse(errorBody)
          alert(`Échec de la suppression de la facture: ${errorJson.message || errorJson.details || "Erreur inconnue"}`)
        } catch (parseError) {
          alert(`Échec de la suppression de la facture: ${errorBody}`)
        }
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
      alert("Une erreur réseau est survenue lors de la suppression. Veuillez vérifier votre connexion.")
    }
  }

  const addMaterialStep = async (e) => {
    e.preventDefault()
    if (!selectedClient) return

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          stepName: newMaterialStep.stepName,
          descriptions: newMaterialStep.descriptions.filter((desc) => desc.description.trim() !== ""),
        }),
      })

      if (response.ok) {
        fetchClientData(selectedClient.id)
        setNewMaterialStep({
          stepName: "",
          descriptions: [{ description: "", quantity: "", price: "" }],
        })
        setShowMaterialDialog(false)
      } else {
        const errorBody = await response.text()
        console.error("Failed to add material step. Status:", response.status, "Body:", errorBody)
        try {
          const errorJson = JSON.parse(errorBody)
          alert(`Échec de l'ajout de l'étape: ${errorJson.message || errorJson.details || "Erreur inconnue"}`)
        } catch (parseError) {
          alert(`Échec de l'ajout de l'étape: ${errorBody}`)
        }
      }
    } catch (error) {
      console.error("Error adding material step:", error)
      alert("Une erreur réseau est survenue. Veuillez vérifier votre connexion.")
    }
  }

  const addDescriptionField = () => {
    setNewMaterialStep({
      ...newMaterialStep,
      descriptions: [...newMaterialStep.descriptions, { description: "", quantity: "", price: "" }],
    })
  }

  const updateDescription = (index, field, value) => {
    const updatedDescriptions = newMaterialStep.descriptions.map((desc, i) =>
      i === index ? { ...desc, [field]: value } : desc,
    )
    setNewMaterialStep({ ...newMaterialStep, descriptions: updatedDescriptions })
  }

  const removeDescription = (index) => {
    if (newMaterialStep.descriptions.length > 1) {
      const updatedDescriptions = newMaterialStep.descriptions.filter((_, i) => i !== index)
      setNewMaterialStep({ ...newMaterialStep, descriptions: updatedDescriptions })
    }
  }

  const editMaterialStep = (step) => {
    setEditingStep({
      id: step.id,
      stepName: step.name,
      descriptions: step.descriptions || [{ description: "", quantity: "", price: "" }],
    })
    setShowEditMaterialDialog(true)
  }

  const updateMaterialStep = async (e) => {
    e.preventDefault()
    if (!selectedClient || !editingStep) return

    try {
      const response = await fetch(`/api/materials/${editingStep.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepName: editingStep.stepName,
          descriptions: editingStep.descriptions.filter((desc) => desc.description.trim() !== ""),
        }),
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          console.log("Material step updated successfully:", data)
          fetchClientData(selectedClient.id)
          setEditingStep(null)
          setShowEditMaterialDialog(false)
        } else {
          const errorText = await response.text()
          console.error("Server returned non-JSON response (likely HTML):", errorText)
          alert("Une erreur inattendue est survenue. Veuillez réessayer ou vous reconnecter.")
        }
      } else {
        const errorBody = await response.text()
        console.error("Failed to update material step. Status:", response.status, "Body:", errorBody)
        try {
          const errorJson = JSON.parse(errorBody)
          alert(`Échec de la mise à jour de l'étape: ${errorJson.message || errorJson.details || "Erreur inconnue"}`)
        } catch (parseError) {
          alert(`Échec de la mise à jour de l'étape: ${errorBody}`)
        }
      }
    } catch (error) {
      console.error("Error updating material step:", error)
      alert("Une erreur réseau est survenue. Veuillez vérifier votre connexion.")
    }
  }

  const updateEditingDescription = (index, field, value) => {
    const updatedDescriptions = editingStep.descriptions.map((desc, i) =>
      i === index ? { ...desc, [field]: value } : desc,
    )
    setEditingStep({ ...editingStep, descriptions: updatedDescriptions })
  }

  const addEditingDescriptionField = () => {
    setEditingStep({
      ...editingStep,
      descriptions: [...editingStep.descriptions, { description: "", quantity: "", price: "" }],
    })
  }

  const removeEditingDescription = (index) => {
    if (editingStep.descriptions.length > 1) {
      const updatedDescriptions = editingStep.descriptions.filter((_, i) => i !== index)
      setEditingStep({ ...editingStep, descriptions: updatedDescriptions })
    }
  }

  const calculateStepTotal = (descriptions) => {
    return descriptions.reduce((total, desc) => {
      const quantity = Number.parseFloat(desc.quantity) || 0
      const price = Number.parseFloat(desc.price) || 0
      return total + quantity * price
    }, 0)
  }

  const handleDeleteStep = (stepId) => {
    setStepToDelete(stepId)
    setShowConfirmDeleteDialog(true)
  }

  const confirmDeleteStep = async () => {
    if (!stepToDelete) return

    try {
      const response = await fetch(`/api/materials/${stepToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchClientData(selectedClient.id)
        setStepToDelete(null)
        setShowConfirmDeleteDialog(false)
      } else {
        const errorBody = await response.text()
        console.error("Failed to delete material step. Status:", response.status, "Body:", errorBody)
        try {
          const errorJson = JSON.parse(errorBody)
          alert(`Échec de la suppression de l'étape: ${errorJson.message || errorJson.details || "Erreur inconnue"}`)
        } catch (parseError) {
          alert(`Échec de la suppression de l'étape: ${errorBody}`)
        }
      }
    } catch (error) {
      console.error("Error deleting material step:", error)
      alert("Une erreur réseau est survenue lors de la suppression. Veuillez vérifier votre connexion.")
    }
  }

  return (
    <Layout currentPath="/clients">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestion des Recettes</h1>
          <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Nouveau Article
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau Article</DialogTitle>
              </DialogHeader>
              <form onSubmit={addClient} className="space-y-4">
                <div>
                  <Label htmlFor="nom">Article</Label>
                  <Input
                    id="nom"
                    value={newClient.nom}
                    onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prenom">Description</Label>
                  <Input
                    id="prenom"
                    value={newClient.prenom}
                    onChange={(e) => setNewClient({ ...newClient, prenom: e.target.value })}
                    required
                  />
                </div>
               
                <Button type="submit">Ajouter</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Recette
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Chargement...</p>
              ) : (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedClient?.id === client.id
                          ? "bg-blue-100 border-blue-300 border"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="font-medium">
                        {client.prenom} {client.nom}
                      </div>
                      {client.telephone && <div className="text-sm text-gray-600">{client.telephone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails du client sélectionné */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                  
                  <TabsTrigger value="materials" className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Ingrédient
                  </TabsTrigger>
                </TabsList>

             

                <TabsContent value="materials">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          Ingredient 
                        </CardTitle>
                        <div className="flex gap-2">
                          
                          <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouvelle Étape
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Ajouter une nouvelle étape de matière</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={addMaterialStep} className="space-y-4">
                                <div>
                                  <Label htmlFor="stepName">Nom de l'étape</Label>
                                  <Input
                                    id="stepName"
                                    value={newMaterialStep.stepName}
                                    onChange={(e) =>
                                      setNewMaterialStep({ ...newMaterialStep, stepName: e.target.value })
                                    }
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Descriptions</Label>
                                  {newMaterialStep.descriptions.map((desc, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                      <Input
                                        placeholder="Description"
                                        value={desc.description}
                                        onChange={(e) => updateDescription(index, "description", e.target.value)}
                                        className="flex-1"
                                      />
                                    
                                      {newMaterialStep.descriptions.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeDescription(index)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button type="button" variant="outline" onClick={addDescriptionField}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter une description
                                  </Button>
                                </div>

                               

                                <Button type="submit">Ajouter l'étape</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {materials.map((material) => (
                          <div key={material.id} className="border rounded p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{material.name}</h4>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => editMaterialStep(material)}>
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteStep(material.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                            {material.descriptions && material.descriptions.length > 0 && (
                              <div className="space-y-1">
                                {material.descriptions.map((desc, index) => (
                                  <div key={index} className="text-sm flex justify-between">
                                    <span>{desc.description}</span>
                                    
                                  </div>
                                ))}
                               
                              </div>
                            )}
                          </div>
                        ))}
                        {materials.length === 0 && <p className="text-gray-500">Aucune matière enregistrée.</p>}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Sélectionnez un client pour voir ses détails</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog pour modifier une facture */}
        <Dialog open={showEditInvoiceDialog} onOpenChange={setShowEditInvoiceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le paiement</DialogTitle>
            </DialogHeader>
            {editingInvoice && (
              <form onSubmit={updateInvoice} className="space-y-4">
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingInvoice.description}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lignes de facturation</Label>
                  {editingInvoice.lines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => updateEditingInvoiceLine(index, "description", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Quantité"
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => updateEditingInvoiceLine(index, "quantity", e.target.value)}
                        className="w-24"
                      />
                      <Input
                        placeholder="Prix unitaire"
                        type="number"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateEditingInvoiceLine(index, "unit_price", e.target.value)}
                        className="w-32"
                      />
                      {editingInvoice.lines.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditingInvoiceLine(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addEditingInvoiceLineField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une ligne
                  </Button>
                </div>

                <div className="text-right font-bold">
                  Total: {calculateInvoiceLineTotal(editingInvoice.lines).toFixed(2)}TND
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Mettre à jour</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditInvoiceDialog(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog pour modifier une étape de matière */}
        <Dialog open={showEditMaterialDialog} onOpenChange={setShowEditMaterialDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'étape de Les Ingredients</DialogTitle>
            </DialogHeader>
            {editingStep && (
              <form onSubmit={updateMaterialStep} className="space-y-4">
                <div>
                  <Label htmlFor="edit-stepName">Nom du Article</Label>
                  <Input
                    id="edit-stepName"
                    value={editingStep.stepName}
                    onChange={(e) => setEditingStep({ ...editingStep, stepName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descriptions</Label>
                  {editingStep.descriptions.map((desc, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Description"
                        value={desc.description}
                        onChange={(e) => updateEditingDescription(index, "description", e.target.value)}
                        className="flex-1"
                      />
                      
                      {editingStep.descriptions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditingDescription(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addEditingDescriptionField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une description
                  </Button>
                </div>

               

                <div className="flex gap-2">
                  <Button type="submit">Mettre à jour</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditMaterialDialog(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation pour supprimer une étape */}
        <AlertDialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette étape de matière ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteStep} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmation pour supprimer une facture */}
        <AlertDialog open={showConfirmDeleteInvoiceDialog} onOpenChange={setShowConfirmDeleteInvoiceDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteInvoice} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  )
}

