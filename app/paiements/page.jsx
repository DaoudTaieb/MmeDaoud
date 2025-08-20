"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RecettesPage() {
  const [recettes, setRecettes] = useState([])
  const [newRecette, setNewRecette] = useState({ nom: "", ingredients: "" })
  const [editingRecetteId, setEditingRecetteId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecettes()
  }, [])

  const fetchRecettes = async () => {
    try {
      const response = await fetch("/api/recettes")
      const data = await response.json()
      setRecettes(data)
    } catch (error) {
      console.error("Erreur lors du chargement des recettes:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveRecette = async (e) => {
    e.preventDefault()
    if (!newRecette.nom || !newRecette.ingredients) return

    try {
      const method = editingRecetteId ? "PUT" : "POST"
      const url = editingRecetteId ? `/api/recettes/${editingRecetteId}` : "/api/recettes"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecette),
      })

      if (response.ok) {
        setNewRecette({ nom: "", ingredients: "" })
        setEditingRecetteId(null)
        fetchRecettes()
      } else {
        const errorText = await response.text()
        alert("Erreur: " + errorText)
      }
    } catch (error) {
      console.error("Erreur réseau:", error)
      alert("Une erreur réseau est survenue.")
    }
  }

  const editRecette = (recette) => {
    setEditingRecetteId(recette.id)
    setNewRecette({ nom: recette.nom, ingredients: recette.ingredients })
  }

  const deleteRecette = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette recette ?")) return

    try {
      const response = await fetch(`/api/recettes/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchRecettes()
      } else {
        const errorText = await response.text()
        alert("Erreur: " + errorText)
      }
    } catch (error) {
      console.error("Erreur réseau:", error)
      alert("Une erreur réseau est survenue.")
    }
  }

  return (
    <Layout currentPath="/recettes">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Recettes</h1>
            <p className="text-gray-600">Enregistrez, modifiez ou supprimez vos recettes de gâteaux</p>
          </div>
        </div>

        {/* Formulaire d'ajout/modification */}
        <Card>
          <CardHeader>
            <CardTitle>{editingRecetteId ? "Modifier la Recette" : "Ajouter une Recette"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveRecette} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du Gâteau</Label>
                <Input
                  id="nom"
                  value={newRecette.nom}
                  onChange={(e) => setNewRecette({ ...newRecette, nom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingrédients</Label>
                <Input
                  id="ingredients"
                  value={newRecette.ingredients}
                  onChange={(e) => setNewRecette({ ...newRecette, ingredients: e.target.value })}
                  required
                  placeholder="Séparez les ingrédients par une virgule"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRecetteId ? "Enregistrer Modifications" : "Ajouter Recette"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liste des recettes */}
        <Card>
          <CardHeader>
            <CardTitle>Recettes Enregistrées</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500">Chargement...</p>
            ) : recettes.length === 0 ? (
              <p className="text-center text-gray-500">Aucune recette enregistrée</p>
            ) : (
              <ul className="space-y-3">
                {recettes.map((recette) => (
                  <li key={recette.id} className="border rounded-lg p-3 bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{recette.nom}</p>
                      <p className="text-gray-700">{recette.ingredients}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => editRecette(recette)}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteRecette(recette.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
