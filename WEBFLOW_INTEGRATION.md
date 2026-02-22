# Intégration Webflow

Ce guide explique comment intégrer le simulateur dans votre site Webflow via iframe.

## 🎯 URL du simulateur

Une fois déployé sur Vercel, votre URL sera :
```
https://votre-app.vercel.app/simulateur?embed=1
```

## 📝 Code HTML/CSS pour Webflow

### Option 1 : Iframe responsive (recommandé)

Collez ce code dans un **Embed HTML** sur votre page Webflow :

```html
<div class="simulateur-container">
  <iframe 
    id="simulateur-iframe"
    src="https://votre-app.vercel.app/simulateur?embed=1"
    frameborder="0"
    scrolling="no"
    style="width: 100%; min-height: 100vh; border: none; display: block;"
    allow="clipboard-write"
    title="Simulateur de devis"
  ></iframe>
</div>

<style>
  .simulateur-container {
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  #simulateur-iframe {
    width: 100%;
    min-height: 100vh;
    border: none;
    display: block;
  }

  /* Responsive mobile */
  @media (max-width: 768px) {
    #simulateur-iframe {
      min-height: 120vh; /* Un peu plus haut sur mobile */
    }
  }

  /* Fallback si iframe bloqué */
  .simulateur-container::before {
    content: "Le simulateur nécessite JavaScript. Veuillez activer JavaScript dans votre navigateur.";
    display: none;
    padding: 2rem;
    text-align: center;
    background: #f5f5f5;
    border-radius: 8px;
    margin: 2rem;
  }

  /* Si iframe ne charge pas, afficher le fallback */
  @supports not (display: grid) {
    .simulateur-container::before {
      display: block;
    }
  }
</style>

<script>
  // Ajuster la hauteur de l'iframe automatiquement
  (function() {
    const iframe = document.getElementById('simulateur-iframe');
    if (!iframe) return;

    // Écouter les messages de l'iframe (si vous implémentez postMessage)
    window.addEventListener('message', function(event) {
      // Vérifier l'origine pour la sécurité
      if (event.origin !== 'https://votre-app.vercel.app') return;
      
      if (event.data.type === 'resize') {
        iframe.style.height = event.data.height + 'px';
      }
    });

    // Fallback : ajuster la hauteur après chargement
    iframe.addEventListener('load', function() {
      try {
        // Essayer d'accéder à la hauteur du contenu (nécessite même origine ou CORS)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          const height = Math.max(
            iframeDoc.body.scrollHeight,
            iframeDoc.body.offsetHeight,
            iframeDoc.documentElement.clientHeight,
            iframeDoc.documentElement.scrollHeight,
            iframeDoc.documentElement.offsetHeight
          );
          iframe.style.height = height + 'px';
        }
      } catch (e) {
        // Cross-origin : utiliser une hauteur fixe ou min-height
        iframe.style.minHeight = '100vh';
      }
    });
  })();
</script>
```

### Option 2 : Version simplifiée (sans JavaScript)

Si vous préférez une version plus simple sans ajustement automatique :

```html
<div class="simulateur-wrapper">
  <iframe 
    src="https://votre-app.vercel.app/simulateur?embed=1"
    frameborder="0"
    style="width: 100%; min-height: 100vh; border: none; display: block;"
    allow="clipboard-write"
    title="Simulateur de devis"
  ></iframe>
</div>

<style>
  .simulateur-wrapper {
    width: 100%;
    position: relative;
  }
  
  .simulateur-wrapper iframe {
    width: 100%;
    min-height: 100vh;
    border: none;
    display: block;
  }

  @media (max-width: 768px) {
    .simulateur-wrapper iframe {
      min-height: 120vh;
    }
  }
</style>
```

## 📍 Instructions Webflow

### 1. Créer la page "Simulateur"

1. Dans Webflow, créez une nouvelle page nommée **"Simulateur"**
2. Ajoutez un élément **Embed** (HTML Embed)
3. Collez le code HTML ci-dessus
4. **Important** : Remplacez `https://votre-app.vercel.app` par votre URL Vercel réelle

### 2. Configuration SEO

Dans les **Page Settings** de la page Simulateur :

- **Title** : "Simulateur de Devis | Votre Agence"
- **Description** : "Obtenez une estimation de prix personnalisée pour votre projet web"
- **Open Graph Image** : Ajoutez une image si vous le souhaitez

**Optionnel** : Si vous voulez que la page ne soit pas indexée (car c'est juste un iframe) :

```html
<!-- Dans les Custom Code → Head Code -->
<meta name="robots" content="noindex, nofollow">
```

### 3. Styling Webflow

- **Container** : Largeur 100% (pas de max-width)
- **Padding** : 0px (l'iframe gère son propre padding)
- **Background** : Transparent ou selon votre design

### 4. Responsive

Le CSS inclus gère déjà le responsive, mais vous pouvez ajuster dans Webflow :
- **Desktop** : Hauteur minimale 100vh
- **Tablet** : Hauteur minimale 100vh
- **Mobile** : Hauteur minimale 120vh (pour éviter le scroll)

## 🎨 Personnalisation

### Thème clair

L'URL avec `?embed=1` active déjà un mode "clean" (sans header, marges réduites).

### Thème personnalisé

Si vous voulez un thème encore plus personnalisé, vous pouvez ajouter :

```html
<!-- URL avec thème personnalisé -->
<iframe src="https://votre-app.vercel.app/simulateur?embed=1&theme=light"></iframe>
```

## 🔒 Sécurité

### Content Security Policy (CSP)

Si votre site Webflow a une CSP stricte, ajoutez dans les **Custom Code → Head Code** :

```html
<meta http-equiv="Content-Security-Policy" content="frame-src https://votre-app.vercel.app;">
```

### X-Frame-Options

Par défaut, Next.js permet l'embed. Si vous voulez restreindre :

Voir la section CORS dans `DEPLOYMENT.md` pour plus d'infos.

## 🧪 Test

1. Publiez votre page Webflow
2. Testez sur desktop, tablet et mobile
3. Vérifiez que l'iframe se charge correctement
4. Testez le formulaire complet jusqu'à la soumission

## 🐛 Dépannage

### L'iframe ne s'affiche pas
- Vérifiez que l'URL Vercel est correcte
- Vérifiez que la page `/simulateur?embed=1` fonctionne directement
- Vérifiez la console du navigateur pour les erreurs

### L'iframe est trop petite/grande
- Ajustez `min-height` dans le CSS
- Utilisez la version avec JavaScript pour un ajustement automatique

### Le formulaire ne fonctionne pas
- Vérifiez que l'API `/api/leads` fonctionne (testez directement)
- Vérifiez les variables d'environnement dans Vercel
- Consultez les logs Vercel pour les erreurs

## 📱 Alternative : Lien direct

Si l'iframe pose problème, vous pouvez aussi simplement créer un lien :

```html
<a href="https://votre-app.vercel.app/simulateur" target="_blank" class="button">
  Lancer le simulateur
</a>
```

Cela ouvrira le simulateur dans un nouvel onglet.
