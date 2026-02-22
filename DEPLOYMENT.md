# Guide de déploiement Vercel

Ce guide vous explique comment déployer l'application Next.js sur Vercel et l'intégrer dans votre site Webflow.

## 📋 Prérequis

- Un compte GitHub
- Un compte Vercel (gratuit)
- Un compte Notion avec une base de données configurée
- Un site Webflow

## 🚀 Étape 1 : Préparer le projet

### 1.1 Vérifier la configuration

Les scripts dans `package.json` sont déjà correctement configurés :
- ✅ `build`: `next build`
- ✅ `start`: `next start`
- ✅ `dev`: `next dev`

### 1.2 Vérifier les secrets

✅ **Aucun secret n'est exposé côté client** :
- `NOTION_TOKEN` et `NOTION_DATABASE_ID` sont uniquement utilisés dans `/app/api/leads/route.ts` (server-side)
- Les variables d'environnement ne sont jamais exposées au client

### 1.3 Variables d'environnement

Créez un fichier `.env.local` (déjà dans `.gitignore`) avec :

```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**⚠️ Ne commitez JAMAIS ce fichier !**

## 🌐 Étape 2 : Déployer sur Vercel

### 2.1 Préparer le repository GitHub

1. Créez un nouveau repository sur GitHub (ou utilisez un existant)
2. Poussez votre code :

```bash
git init
git add .
git commit -m "Initial commit: Simulateur de devis"
git branch -M main
git remote add origin https://github.com/votre-username/votre-repo.git
git push -u origin main
```

### 2.2 Importer le projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New..."** → **"Project"**
3. Importez votre repository GitHub
4. Vercel détectera automatiquement Next.js

### 2.3 Configurer les variables d'environnement

Dans la page de configuration du projet Vercel :

1. **Environment Variables** → Ajoutez :
   - `NOTION_TOKEN` = `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - `NOTION_DATABASE_ID` = `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

2. **Important** : Sélectionnez les environnements :
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development** (optionnel)

3. Cliquez sur **"Deploy"**

### 2.4 Premier déploiement

Vercel va :
1. Installer les dépendances (`npm install`)
2. Builder l'application (`npm run build`)
3. Déployer sur un URL unique (ex: `votre-app.vercel.app`)

⏱️ **Temps estimé** : 2-5 minutes

## ✅ Étape 3 : Tester le déploiement

### 3.1 Tester l'application

1. Visitez l'URL fournie par Vercel : `https://votre-app.vercel.app`
2. Testez le simulateur : `/simulateur`
3. Testez le mode embed : `/simulateur?embed=1`

### 3.2 Tester l'API en production

```bash
# Test de l'endpoint API
curl -X POST https://votre-app.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {
      "name": "Test User",
      "email": "test@example.com"
    },
    "answers": {
      "type-projet": "site-vitrine",
      "nombre-pages": "1-5",
      "design": "oui-complet",
      "fonctionnalites": "basique",
      "delai": "normal",
      "referencement": "non"
    }
  }'
```

**Réponse attendue** :
```json
{
  "ok": true,
  "estimate": { "min": 2000, "max": 3000 },
  "breakdown": [...],
  "notionUrl": "https://notion.so/..."
}
```

### 3.3 Vérifier les logs

Dans le dashboard Vercel :
- **Deployments** → Cliquez sur le dernier déploiement
- **Functions** → Vérifiez les logs de `/api/leads`

## 🔗 Étape 4 : Intégration Webflow

Voir le fichier `WEBFLOW_INTEGRATION.md` pour les instructions détaillées.

## 🔄 Mises à jour futures

À chaque push sur `main`, Vercel redéploie automatiquement :
- **Production** : déploiement automatique depuis `main`
- **Preview** : déploiement automatique depuis les branches/PR

## 🐛 Dépannage

### Erreur : "NOTION_TOKEN is not defined"
- Vérifiez que les variables d'environnement sont bien configurées dans Vercel
- Redéployez après avoir ajouté les variables

### Erreur : "Failed to create lead in Notion"
- Vérifiez que le token Notion est valide
- Vérifiez que la base de données est partagée avec l'intégration Notion
- Vérifiez les noms exacts des propriétés dans Notion

### Build échoue
- Vérifiez les logs dans Vercel
- Testez le build localement : `npm run build`

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Notion API](https://developers.notion.com/)
