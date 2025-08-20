'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Save } from 'lucide-react';

export default function AddEmployeePage() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    type: '',
    Salaire: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          nom: '',
          prenom: '',
          telephone: '',
          type: '',
          Salaire: ''
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout currentPath="/employees/add">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <UserPlus className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ajouter un Employé</h1>
            <p className="text-gray-600">Enregistrer un nouveau membre de l'équipe</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations de l'Employé</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    placeholder="Nom de famille"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    placeholder="Prénom"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Numéro de Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  placeholder="Numéro de téléphone"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type d'Employé</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salaire">Employé Salaire journalier</SelectItem>
                    <SelectItem value="metre">Employé par Mètre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'Salaire' && (
                <div className="space-y-2">
                  <Label htmlFor="Salaire">Salaire journalier (TND)</Label>
                  <Input
                    id="Salaire"
                    type="number"
                    value={formData.Salaire}
                    onChange={(e) => setFormData({...formData, Salaire: e.target.value})}
                    placeholder="Salaire journalier"
                    required
                  />
                </div>
              )}

              {success && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200">
                  Employé ajouté avec succès!
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Ajout en cours...' : 'Ajouter l\'Employé'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
