# 💰 Suivi Dépenses Familiales 🇸🇳

Application de gestion des dépenses familiales, conçue pour les familles sénégalaises.

## Stack technique
- **Frontend** : Next.js 14 (App Router) + Tailwind CSS
- **Base de données + Auth** : Supabase
- **Emails** : Resend
- **Déploiement** : Vercel

---

## 🚀 Installation et déploiement

### Étape 1 — Cloner et installer

```bash
git clone https://github.com/VOTRE_USERNAME/suivi-depenses.git
cd suivi-depenses
npm install
```

### Étape 2 — Configurer Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Dans l'éditeur SQL, exécutez le script `supabase-schema.sql` fourni
4. Récupérez l'URL et la clé anon dans **Settings > API**

### Étape 3 — Configurer Resend (emails)

1. Créez un compte sur [resend.com](https://resend.com)
2. Créez une clé API
3. Notez la clé `re_...`

### Étape 4 — Variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
```

### Étape 5 — Tester en local

```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000)

### Étape 6 — Déployer sur Vercel

1. Poussez votre code sur GitHub :
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/suivi-depenses.git
git push -u origin main
```

2. Allez sur [vercel.com](https://vercel.com) → **New Project**
3. Importez votre repo GitHub
4. Dans **Environment Variables**, ajoutez les 3 variables du `.env.local`
5. Cliquez **Deploy** ✅

Chaque `git push` redéploie automatiquement !

---

## ✅ Fonctionnalités

- 🔐 Inscription / connexion sécurisée (email + mot de passe)
- 📊 Tableau de bord avec graphiques (dépenses par catégorie)
- 💸 Gestion des dépenses avec catégories sénégalaises
- 💰 Gestion des revenus / entrées
- 📅 Historique mois par mois
- 📧 Récapitulatif mensuel par email
- 📱 Interface mobile-first (bottom nav sur téléphone)

## 🛍️ Catégories sénégalaises incluses

- Charges fixes : SENELEC, SDE, Orange/Free, Loyer...
- Alimentation : Marché, Thiéboudienne, Riz/huile...
- Transport : Car rapide, Yango, DDD...
- Social : Ndéwënël, Baptême, Tontine...
- Santé, Éducation, Divers
