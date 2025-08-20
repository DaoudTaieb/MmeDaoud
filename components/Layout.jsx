// AJOUTEZ CETTE LIGNE EN HAUT DE VOTRE FICHIER
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from 'react'; // AJOUT : Pour gérer l'état du menu mobile
import { Cake } from "lucide-react"

// AJOUT : Icônes pour le bouton du menu mobile
import { Menu, X } from 'lucide-react'; 

import {
  HomeIcon,
  UsersIcon,
  DollarSignIcon,
  ClipboardListIcon,
  UserPlusIcon,
  GaugeIcon,
  WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// On transforme la sidebar en son propre composant pour ne pas la dupliquer.
// C'est plus propre et plus facile à maintenir.
const SidebarContent = () => {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", icon: HomeIcon, label: "Tableau de bord" },
    { href: "/employees/add", icon: UserPlusIcon, label: "Ajouter Employé" },
    { href: "/employees/salary", icon: DollarSignIcon, label: "Présence Employés" },
    
        { href: "/salaries", icon: WalletIcon, label: "Gestion Salaire" },
    
        { href: "/paiements", icon: Cake, label: "Recettes" },
   
  ];

  return (
    // On a juste besoin du contenu de la sidebar ici
    <div className="flex h-full flex-col bg-white p-6">
      <div className="text-2xl font-bold text-gray-800 mb-8">Pâtisserie Mme Daoud</div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center p-3 rounded-lg transition-colors duration-200",
                isActive ? "bg-blue-500 text-white shadow-md" : "text-gray-700 hover:bg-gray-100 hover:text-blue-500",
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};


// Voici votre composant Layout principal, maintenant responsive
export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* --- SIDEBAR POUR GRAND ÉCRAN (lg) --- */}
      {/* Elle est cachée par défaut (hidden) et ne s'affiche qu'à partir de la taille "lg" */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </aside>

      {/* --- CONTENU PRINCIPAL --- */}
      {/* On ajoute un padding à gauche sur grand écran pour faire de la place à la sidebar */}
      <div className="lg:pl-64">
        
        {/* --- BARRE DU HAUT POUR MOBILE --- */}
        {/* Elle n'est visible que sur les petits écrans (lg:hidden) */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button 
            type="button" 
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-gray-900">
            Tableau de bord
          </div>
        </div>

        <main className="p-8">{children}</main>
      </div>

      {/* --- SIDEBAR FLOTTANTE POUR MOBILE (quand elle est ouverte) --- */}
      {isSidebarOpen && (
        <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Fond noir semi-transparent */}
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsSidebarOpen(false)}></div>
          
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setIsSidebarOpen(false)}>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              {/* On réutilise le même contenu de sidebar ici */}
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
