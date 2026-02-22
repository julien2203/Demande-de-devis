# Simulateur de Devis

Application Next.js pour générer des devis personnalisés avec intégration Notion et déploiement Vercel.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Configuration

Créez un fichier `.env.local` (voir `.env.example`) :

```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** : Guide complet de déploiement sur Vercel
- **[WEBFLOW_INTEGRATION.md](./WEBFLOW_INTEGRATION.md)** : Instructions d'intégration dans Webflow
- **[ENV_SETUP.md](./ENV_SETUP.md)** : Configuration des variables d'environnement Notion

## 🎯 Fonctionnalités

- ✅ Wizard multi-step (12 questions max)
- ✅ Sauvegarde automatique dans localStorage
- ✅ Calcul de prix déterministe (min/max)
- ✅ Intégration Notion pour les leads
- ✅ Mode embed pour intégration iframe
- ✅ API REST avec validation Zod
- ✅ Tests unitaires

## 🏗️ Structure

```
├── app/
│   ├── api/leads/          # API route pour créer des leads
│   ├── simulateur/         # Page du wizard
│   └── resultat/           # Page de résultat
├── components/
│   ├── ui/                 # Composants shadcn/ui
│   └── wizard/             # Composants du wizard
├── lib/
│   ├── pricing-engine.ts   # Moteur de calcul de prix
│   ├── notion.ts           # Client Notion
│   └── types.ts            # Types TypeScript
└── data/
    ├── questions.json      # Questions du wizard
    └── pricing-config.json # Configuration du pricing
```

## 🧪 Tests

```bash
npm test
```

## 📦 Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes.

### Résumé rapide

1. Poussez le code sur GitHub
2. Importez le projet sur Vercel
3. Configurez les variables d'environnement
4. Déployez !

## 🔗 Intégration Webflow

Voir [WEBFLOW_INTEGRATION.md](./WEBFLOW_INTEGRATION.md) pour le code HTML/CSS à coller dans Webflow.

### URL du simulateur en mode embed

```
https://votre-app.vercel.app/simulateur?embed=1
```

## 🔒 Sécurité

- ✅ Aucun secret exposé côté client
- ✅ Validation Zod sur toutes les entrées API
- ✅ CORS configuré pour Webflow
- ✅ Variables d'environnement sécurisées

## 📝 Scripts disponibles

- `npm run dev` : Développement local
- `npm run build` : Build de production
- `npm run start` : Serveur de production
- `npm run lint` : Linter ESLint
- `npm test` : Tests unitaires

## 🛠️ Technologies

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Zod** (validation)
- **Notion API**
- **Jest** (tests)

## 📄 Licence

Private - Tous droits réservés
