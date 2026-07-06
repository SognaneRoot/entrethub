# Entrethub — Coach Carrière IA

> Préparez vos candidatures. Réussissez vos entretiens.

## Stack

- **Frontend** — Next.js 14 + TypeScript + Tailwind CSS
- **Auth** — Clerk
- **Database** — Supabase (Postgres)
- **AI** — OpenAI / Anthropic
- **Hosting** — Vercel

---

## Installation locale (Windows PowerShell)

### 1. Cloner et installer

```powershell
git clone https://github.com/VOTRE_USERNAME/entrethub.git
cd entrethub
npm install
```

### 2. Variables d'environnement

```powershell
copy .env.local.example .env.local
# Ouvrir .env.local dans VS Code et remplir les clés
```

### 3. Base de données Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de `supabase-schema.sql`
4. Cliquer **Run**

### 4. Clerk

1. Créer un projet sur [clerk.com](https://clerk.com)
2. Copier `Publishable Key` et `Secret Key` dans `.env.local`

### 5. Lancer le dev

```powershell
npm run dev
# → http://localhost:3000
```

---

## Déploiement Vercel

```powershell
# 1. Pousser sur GitHub
git add .
git commit -m "feat: initial setup"
git push origin main

# 2. Connecter sur vercel.com → Import Project → GitHub
# 3. Ajouter toutes les variables d'env dans Vercel Dashboard
# 4. Deploy automatique à chaque push 🚀
```

---

## Structure

```
src/
├── app/
│   ├── (auth)/          # sign-in, sign-up
│   ├── (dashboard)/     # espace utilisateur protégé
│   ├── api/             # routes serverless
│   ├── layout.tsx       # layout global + Clerk
│   └── page.tsx         # landing page
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Header, Sidebar
│   └── features/        # modules métiers
├── lib/
│   ├── supabase.ts      # client Supabase
│   └── utils.ts         # helpers
├── types/index.ts       # tous les types TypeScript
└── middleware.ts        # protection routes Clerk
```

---

## Phases de développement

- [x] **Phase 1** — Initialisation projet ✅
- [ ] **Phase 2** — Authentication Clerk
- [ ] **Phase 3** — Database Supabase
- [ ] **Phase 4** — UI Foundation (Header, Sidebar)
- [ ] **Phase 5** — Dashboard Core
- [ ] **Phase 6** — Module CV Builder
- [ ] **Phase 7** — Optimisation IA CV
- [ ] **Phase 8** — Interview Simulator
- [ ] **Phase 9** — Career Coach
- [ ] **Phase 10** — Polish UI/UX
- [ ] **Phase 11** — Tests
- [ ] **Phase 12** — Production
