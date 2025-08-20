"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Eye, Trash2, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: number
  nom: string
  prenom: string
  telephone: string
  adresse: string
}

interface Article {
  description: string
  quantite: number
  prix_unitaire: number
  total: number
}

interface Devis {
  id: number
  client_id: number
  titre: string
  description: string
  articles: Article[]
  total_ht: number
  tva: number
  total_ttc: number
  statut: string
  validite_jours: number
  created_at: string
  nom: string
  prenom: string
}

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [newDevis, setNewDevis] = useState({
    client_id: "",
    titre: "",
    description: "",
    validite_jours: 30,
    tva: 20,
  })

  const [articles, setArticles] = useState<Article[]>([{ description: "", quantite: 1, prix_unitaire: 0, total: 0 }])

  useEffect(() => {
    fetchDevis()
    fetchClients()
  }, [])

  const fetchDevis = async () => {
    try {
      const response = await fetch("/api/devis")
      if (!response.ok) throw new Error("Failed to fetch devis")
      const data = await response.json()
      setDevis(data)
    } catch (error) {
      console.error("Error fetching devis:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les devis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      })
    }
  }

  const addArticle = () => {
    setArticles([...articles, { description: "", quantite: 1, prix_unitaire: 0, total: 0 }])
  }

  const removeArticle = (index: number) => {
    if (articles.length > 1) {
      setArticles(articles.filter((_, i) => i !== index))
    }
  }

  const updateArticle = (index: number, field: keyof Article, value: string | number) => {
    const updatedArticles = [...articles]
    updatedArticles[index] = { ...updatedArticles[index], [field]: value }

    if (field === "quantite" || field === "prix_unitaire") {
      updatedArticles[index].total = updatedArticles[index].quantite * updatedArticles[index].prix_unitaire
    }

    setArticles(updatedArticles)
  }

  // Fonction pour calculer les totaux
  const calculateTotals = (currentArticles: Article[], currentTva: number) => {
    const totalHT = currentArticles.reduce((sum, article) => sum + article.total, 0)
    const tvaAmount = (totalHT * currentTva) / 100
    const totalTTC = totalHT + tvaAmount
    return { totalHT, tvaAmount, totalTTC }
  }

  // Fonction d'impression pour un devis
  const printDevis = (devisData: Devis) => {
    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.",
          variant: "destructive",
        })
        return
      }

      const client = clients.find(c => c.id === devisData.client_id)
      
      // Calcul de la date d'expiration
      const createdDate = new Date(devisData.created_at)
      const expirationDate = new Date(createdDate)
      expirationDate.setDate(createdDate.getDate() + devisData.validite_jours)

      // Utiliser les totaux du devis existant
      const { total_ht: totalHT, tva, total_ttc } = devisData

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Devis - ${devisData.titre}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
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
              font-size: 28px;
            }
            .company-info {
              text-align: right;
              font-size: 12px;
              color: #666;
            }
            .devis-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .client-info, .devis-details { 
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              width: 48%;
            }
            .client-info h3, .devis-details h3 {
              margin-top: 0;
              color: #2563eb;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .articles-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .articles-table th,
            .articles-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .articles-table th {
              background-color: #2563eb;
              color: white;
              font-weight: bold;
            }
            .articles-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .articles-table .text-right {
              text-align: right;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .totals-table {
              margin-left: auto;
              border-collapse: collapse;
              width: 300px;
            }
            .totals-table td {
              padding: 8px 15px;
              border-bottom: 1px solid #ddd;
            }
            .totals-table .total-final {
              font-weight: bold;
              font-size: 18px;
              background-color: #e3f2fd;
              border-top: 2px solid #2563eb;
            }
            .conditions {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #2563eb;
            }
            .conditions h4 {
              margin-top: 0;
              color: #2563eb;
            }
            .print-date {
              text-align: right;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-en_attente {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-accepte {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-refuse {
              background-color: #fee2e2;
              color: #991b1b;
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
              <h1>DEVIS</h1>
              <p style="margin: 5px 0; color: #666;">N° ${devisData.id.toString().padStart(6, '0')}</p>
            </div>
            <div class="company-info">
              <strong>STBTP</strong><br>
              Société de Travaux du Bâtiment<br>
              et Travaux Publics<br>
              <br>
              Date: ${new Date(devisData.created_at).toLocaleDateString('fr-FR')}<br>
              Validité: ${expirationDate.toLocaleDateString('fr-FR')}
            </div>
          </div>
          
          <div class="devis-info">
            <div class="client-info">
              <h3>Informations Client</h3>
              <p><strong>Nom:</strong> ${client ? `${client.prenom} ${client.nom}` : 'Client non trouvé'}</p>
              <p><strong>Téléphone:</strong> ${client?.telephone || 'Non renseigné'}</p>
              <p><strong>Adresse:</strong> ${client?.adresse || 'Non renseignée'}</p>
            </div>
            
            <div class="devis-details">
              <h3>Détails du Devis</h3>
              <p><strong>Titre:</strong> ${devisData.titre}</p>
              <p><strong>Statut:</strong> 
                <span class="status-badge status-${devisData.statut}">
                  ${devisData.statut === 'en_attente' ? 'En attente' : 
                    devisData.statut === 'accepte' ? 'Accepté' : 'Refusé'}
                </span>
              </p>
              <p><strong>Validité:</strong> ${devisData.validite_jours} jours</p>
              ${devisData.description ? `<p><strong>Description:</strong><br>${devisData.description}</p>` : ''}
            </div>
          </div>

          <div class="articles-section">
            <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">Détail des Articles</h3>
            <table class="articles-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Description</th>
                  <th style="width: 15%;" class="text-right">Quantité</th>
                  <th style="width: 20%;" class="text-right">Prix Unitaire (DT)</th>
                  <th style="width: 15%;" class="text-right">Total (DT)</th>
                </tr>
              </thead>
              <tbody>
                ${devisData.articles.map(article => `
                  <tr>
                    <td>${article.description}</td>
                    <td class="text-right">${article.quantite}</td>
                    <td class="text-right">${article.prix_unitaire.toFixed(2)}</td>
                    <td class="text-right">${article.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td><strong>Total HT:</strong></td>
                <td class="text-right"><strong>${totalHT.toFixed(2)} TND</strong></td>
              </tr>
              <tr>
                <td><strong>TVA (${totalHT > 0 ? ((tva / totalHT) * 100).toFixed(1) : '0.0'}%):</strong></td>
                <td class="text-right"><strong>${tva.toFixed(2)} TND</strong></td>
              </tr>
              <tr class="total-final">
                <td><strong>Total TTC:</strong></td>
                <td class="text-right"><strong>${total_ttc.toFixed(2)} TND</strong></td>
              </tr>
            </table>
          </div>

          <div class="conditions">
            <h4>Conditions Générales</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Ce devis est valable ${devisData.validite_jours} jours à compter de la date d'émission</li>
              <li>Les prix sont exprimés en Dinars Tunisiens (TND) TTC</li>
              <li>Un acompte de 30% sera demandé à la commande</li>
              <li>Les travaux commenceront après réception de l'acompte</li>
              <li>Délai de paiement : 30 jours net</li>
            </ul>
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
    } catch (error) {
      console.error("Erreur lors de l'impression:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'impression.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setNewDevis({
      client_id: "",
      titre: "",
      description: "",
      validite_jours: 30,
      tva: 20,
    })
    setArticles([{ description: "", quantite: 1, prix_unitaire: 0, total: 0 }])
  }

  const createDevis = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Validation
    if (!newDevis.client_id || !newDevis.titre) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      setSubmitting(false)
      return
    }

    if (articles.some((article) => !article.description || article.quantite <= 0 || article.prix_unitaire <= 0)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir correctement tous les articles",
        variant: "destructive",
      })
      setSubmitting(false)
      return
    }

    const { totalHT, tvaAmount, totalTTC } = calculateTotals(articles, newDevis.tva)

    try {
      const response = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDevis,
          client_id: Number.parseInt(newDevis.client_id),
          articles,
          total_ht: totalHT,
          tva: tvaAmount,
          total_ttc: totalTTC,
        }),
      })

      if (!response.ok) throw new Error("Failed to create devis")

      toast({
        title: "Succès",
        description: "Devis créé avec succès",
      })

      fetchDevis()
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error creating devis:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le devis",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatut = async (devisId: number, newStatut: string) => {
    try {
      const response = await fetch("/api/devis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: devisId, statut: newStatut }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès",
      })

      fetchDevis()
    } catch (error) {
      console.error("Error updating statut:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    }
  }

  const getStatutBadge = (statut: string) => {
    const variants = {
      en_attente: "bg-yellow-100 text-yellow-800",
      accepte: "bg-green-100 text-green-800",
      refuse: "bg-red-100 text-red-800",
    }
    const labels = {
      en_attente: "En attente",
      accepte: "Accepté",
      refuse: "Refusé",
    }
    return <Badge className={variants[statut as keyof typeof variants]}>{labels[statut as keyof typeof labels]}</Badge>
  }

  // Fonction de formatage sécurisée des prix
  const formatPrice = (price: any): string => {
    const num = typeof price === "number" ? price : Number.parseFloat(price) || 0
    return num.toFixed(2)
  }

  // Calculer les totaux pour l'affichage du formulaire de création
  const { totalHT, tvaAmount, totalTTC } = calculateTotals(articles, newDevis.tva)

  return (
    <Layout currentPath="/devis">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Devis</h1>
              <p className="text-gray-600">Créez et gérez vos devis clients</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Devis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Devis</DialogTitle>
              </DialogHeader>
              <form onSubmit={createDevis} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={newDevis.client_id}
                      onValueChange={(value) => setNewDevis({ ...newDevis, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.nom} {client.prenom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titre">Titre du Devis *</Label>
                    <Input
                      id="titre"
                      value={newDevis.titre}
                      onChange={(e) => setNewDevis({ ...newDevis, titre: e.target.value })}
                      placeholder="Ex: Rénovation salle de bain"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDevis.description}
                    onChange={(e) => setNewDevis({ ...newDevis, description: e.target.value })}
                    placeholder="Description détaillée du projet..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validite">Validité (jours)</Label>
                    <Input
                      id="validite"
                      type="number"
                      value={newDevis.validite_jours}
                      onChange={(e) =>
                        setNewDevis({ ...newDevis, validite_jours: Number.parseInt(e.target.value) || 30 })
                      }
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tva">TVA (%)</Label>
                    <Input
                      id="tva"
                      type="number"
                      value={newDevis.tva}
                      onChange={(e) => setNewDevis({ ...newDevis, tva: Number.parseFloat(e.target.value) || 20 })}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Articles *</Label>
                    <Button type="button" onClick={addArticle} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter Article
                    </Button>
                  </div>

                  {articles.map((article, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Article {index + 1}</h4>
                        {articles.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => removeArticle(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <Label>Description *</Label>
                          <Input
                            value={article.description}
                            onChange={(e) => updateArticle(index, "description", e.target.value)}
                            placeholder="Description de l'article"
                            required
                          />
                        </div>
                        <div>
                          <Label>Quantité *</Label>
                          <Input
                            type="number"
                            value={article.quantite}
                            onChange={(e) => updateArticle(index, "quantite", Number.parseFloat(e.target.value) || 0)}
                            min="0.1"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label>Prix unitaire (TND) *</Label>
                          <Input
                            type="number"
                            value={article.prix_unitaire}
                            onChange={(e) =>
                              updateArticle(index, "prix_unitaire", Number.parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">Total: {formatPrice(article.total)} TND</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total HT:</span>
                    <span className="font-semibold">{formatPrice(totalHT)} TND</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA ({newDevis.tva}%):</span>
                    <span className="font-semibold">{formatPrice(tvaAmount)} TND</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span className="text-green-600">{formatPrice(totalTTC)} TND</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Création..." : "Créer le Devis"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des devis */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Devis ({devis.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Chargement des devis...</p>
              </div>
            ) : devis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun devis trouvé</p>
                <p className="text-sm">Créez votre premier devis pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {devis.map((d) => (
                  <div key={d.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{d.titre}</h3>
                          {getStatutBadge(d.statut)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Client:</strong> {d.nom} {d.prenom}</p>
                            <p><strong>Date:</strong> {new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div>
                            <p><strong>Total TTC:</strong> {formatPrice(d.total_ttc)} TND</p>
                            <p><strong>Validité:</strong> {d.validite_jours} jours</p>
                          </div>
                        </div>
                        {d.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{d.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDevis(d)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printDevis(d)}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimer
                        </Button>
                        <Select
                          value={d.statut}
                          onValueChange={(value) => updateStatut(d.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_attente">En attente</SelectItem>
                            <SelectItem value="accepte">Accepté</SelectItem>
                            <SelectItem value="refuse">Refusé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour voir les détails d'un devis */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Détails du Devis</DialogTitle>
                {selectedDevis && (
                  <Button
                    variant="outline"
                    onClick={() => printDevis(selectedDevis)}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimer
                  </Button>
                )}
              </div>
            </DialogHeader>
            {selectedDevis && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Informations Générales</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Titre:</strong> {selectedDevis.titre}</p>
                      <p><strong>Client:</strong> {selectedDevis.nom} {selectedDevis.prenom}</p>
                      <p><strong>Date de création:</strong> {new Date(selectedDevis.created_at).toLocaleDateString("fr-FR")}</p>
                      <p><strong>Validité:</strong> {selectedDevis.validite_jours} jours</p>
                      <p><strong>Statut:</strong> {getStatutBadge(selectedDevis.statut)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Montants</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total HT:</strong> {formatPrice(selectedDevis.total_ht)} TND</p>
                      <p><strong>TVA:</strong> {formatPrice(selectedDevis.tva)} TND</p>
                      <p className="text-lg font-bold text-green-600">
                        <strong>Total TTC:</strong> {formatPrice(selectedDevis.total_ttc)} TND
                      </p>
                    </div>
                  </div>
                </div>

                {selectedDevis.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedDevis.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Articles</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Quantité</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Prix Unitaire (TND)</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Total (TND)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDevis.articles.map((article, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2">{article.description}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{article.quantite}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatPrice(article.prix_unitaire)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatPrice(article.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

