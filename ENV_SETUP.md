# Configuration des variables d'environnement

Pour que l'API `/api/leads` fonctionne et crée des leads dans Notion, vous devez configurer les variables d'environnement suivantes.

## Créer le fichier `.env.local`

À la racine du projet, créez un fichier `.env.local` avec le contenu suivant :

```bash
# Notion Integration
# Obtenez votre token depuis https://www.notion.so/my-integrations
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ID de la base de données Notion "Leads - Simulateur Devis"
# Trouvable dans l'URL de la base : https://notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Comment obtenir ces valeurs

### 1. NOTION_TOKEN

1. Allez sur https://www.notion.so/my-integrations
2. Cliquez sur "New integration"
3. Donnez un nom (ex: "Simulateur Devis")
4. Sélectionnez votre workspace
5. Copiez le "Internal Integration Token" (commence par `secret_`)
6. Collez-le dans `.env.local` comme valeur de `NOTION_TOKEN`

### 2. NOTION_DATABASE_ID

1. Créez une base de données dans Notion avec le nom "Leads - Simulateur Devis"
2. Ajoutez les propriétés suivantes (exactement ces noms) :
   - **Name** (title)
   - **Email** (email)
   - **Téléphone** (phone)
   - **Entreprise** (rich_text)
   - **Prestation** (select) - options: "Site vitrine", "E-commerce", "Application Web", "Refonte"
   - **Budget déclaré** (select) - options: "< 5 000€", "5 000€ – 10 000€", "10 000€ – 25 000€", "25 000€+", "Je ne sais pas"
   - **Estimation min** (number)
   - **Estimation max** (number)
   - **Urgence** (select) - options: "Urgent (< 1 mois)", "1–3 mois", "Flexible"
   - **Réponses** (rich_text)
   - **Statut** (select) - options: "New", "Contacted", "Qualified", "Lost"
   - **Source** (select) - options: "Website Simulator", "Other"
3. Partagez la base avec votre intégration (cliquez sur "..." → "Connections" → ajoutez votre intégration)
4. Dans l'URL de la base, copiez l'ID (la partie après le dernier `/` et avant le `?`)
   - Exemple : `https://notion.so/abc123def456` → l'ID est `abc123def456`
   - Si l'ID contient des tirets, gardez-les : `abc123-def456-ghi789`
5. Collez-le dans `.env.local` comme valeur de `NOTION_DATABASE_ID`

## Redémarrer le serveur

Après avoir créé/modifié `.env.local`, **redémarrez le serveur de développement** :

```bash
# Arrêtez le serveur (Ctrl+C) puis :
npm run dev
```

## Vérification

Une fois configuré, testez en soumettant le formulaire sur la page `/resultat`. Si tout fonctionne, vous verrez un message de succès et le lead apparaîtra dans votre base Notion.
