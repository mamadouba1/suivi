export const CATEGORIES_DEPENSES = [
  {
    groupe: 'Charges fixes',
    icone: '🏠',
    items: [
      'Loyer',
      'Électricité (SENELEC)',
      'Eau (SDE/ONAS)',
      'Internet (Orange/Free/Expresso)',
      'Téléphone / Crédit mobile',
      'Gaz (bonbonne)',
      'Assurance',
    ],
  },
  {
    groupe: 'Alimentation',
    icone: '🍚',
    items: [
      'Marché (légumes, poisson, viande)',
      'Riz, huile, condiments',
      'Pain / Boulangerie',
      'Thiéboudienne / Repas quotidien',
      'Café Touba / Ataya',
      'Restaurants / Dibiterie',
    ],
  },
  {
    groupe: 'Transport',
    icone: '🚌',
    items: [
      'Car rapide / Ndiaga Ndiaye',
      'Dakar Dem Dikk (DDD)',
      'Taxi / Yango / InDriver',
      'Carburant',
      'Entretien véhicule',
      'Moto Jakarta',
    ],
  },
  {
    groupe: 'Éducation',
    icone: '📚',
    items: [
      'Frais de scolarité',
      'Fournitures scolaires',
      'Cours particuliers',
      'Livres',
    ],
  },
  {
    groupe: 'Santé',
    icone: '💊',
    items: [
      'Médicaments / Pharmacie',
      'Consultation médicale',
      'Hôpital / Clinique',
      'Mutuelle de santé',
      'Lunettes / Optique',
    ],
  },
  {
    groupe: 'Social & Famille',
    icone: '👨‍👩‍👧',
    items: [
      'Ndéwënël (événements familiaux)',
      'Baptême (Ngënte)',
      'Mariage',
      'Aide famille / Parents',
      'Tontine (cotisation)',
      'Condoléances / Funérailles',
    ],
  },
  {
    groupe: 'Divers',
    icone: '🛍️',
    items: [
      'Habillement / Tissus',
      'Coiffure / Beauté',
      'Loisirs / Sorties',
      'Téléphone (achat)',
      'Électroménager',
      'Imprévus',
      'Autres',
    ],
  },
]

export const TOUTES_CATEGORIES = CATEGORIES_DEPENSES.flatMap((g) => g.items)

export function formatMontant(montant: number, devise = 'FCFA') {
  if (devise === 'FCFA') {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant) + ' FCFA'
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 0,
  }).format(montant)
}

export function getMoisActuel() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatMois(mois: string) {
  const [year, month] = mois.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function getListeMois(nbMois = 12) {
  const mois = []
  for (let i = 0; i < nbMois; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    mois.push({ key, label: formatMois(key) })
  }
  return mois
}

export function getCouleurCategorie(type: string): string {
  const cat = CATEGORIES_DEPENSES.find((g) => g.items.includes(type))
  const couleurs: Record<string, string> = {
    'Charges fixes': '#e58b3a',
    'Alimentation': '#5a8360',
    'Transport': '#4a90d9',
    'Éducation': '#9b59b6',
    'Santé': '#e74c3c',
    'Social & Famille': '#f39c12',
    'Divers': '#95a5a6',
  }
  return couleurs[cat?.groupe || ''] || '#95a5a6'
}
