# Alliance ARM

Application mobile pour l'Alliance pour le Rassemblement Malien (A.R.M).

## 🚀 Configuration

### Backend URL
Le backend est déjà configuré dans `app.json`:
```
https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev
```

### Authentification Administrateur

**Mot de passe par défaut:** `admin123`

L'authentification administrateur a été simplifiée pour utiliser un seul mot de passe. Le système envoie automatiquement ce mot de passe dans les deux headers requis (`x-admin-password` et `x-admin-secret`) pour assurer la compatibilité avec le backend.

#### Accès à l'espace administrateur:
1. Ouvrir l'application
2. Naviguer vers "Admin" dans le menu
3. Entrer le mot de passe: `admin123`
4. Cliquer sur "Se connecter"

## 📱 Fonctionnalités

### Pour les Militants
- **Inscription:** Enregistrement avec nom, commune, profession, téléphone
- **Carte de Membre:** Carte numérique avec QR code téléchargeable
- **Cotisations:** Paiement des cotisations mensuelles/annuelles
- **Messages:** Réception de messages internes du parti
- **Vérification Électorale:** Soumission de résultats électoraux (Module Sentinelle)

### Pour les Administrateurs
- **Tableau de Bord:** Vue d'ensemble des statistiques
- **Gestion des Membres:** Approbation, suspension, changement de rôle
- **Gestion des Actualités:** Création, modification, suppression d'articles
- **Gestion des Événements:** Planification et gestion des événements
- **Vérification Électorale:** Validation des résultats soumis
- **Messages Internes:** Envoi de messages ciblés aux membres
- **Médias:** Téléchargement de photos, vidéos, documents

## 🔧 Architecture Technique

### API Client (`utils/api.ts`)
Le fichier `utils/api.ts` fournit des helpers pour toutes les requêtes API:

- **Requêtes publiques:** `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- **Requêtes authentifiées:** `authenticatedGet`, `authenticatedPost`, `authenticatedPut`, `authenticatedDelete`
- **Requêtes admin:** `adminGet`, `adminPost`, `adminPut`, `adminDelete`

### Authentification
- **Better Auth** pour l'authentification des utilisateurs
- **Stockage sécurisé** des tokens (SecureStore sur mobile, localStorage sur web)
- **Headers admin** automatiquement ajoutés pour les requêtes administrateur

### Composants UI
- **Modal personnalisé** (`components/ui/Modal.tsx`) pour tous les dialogues
- **Pas d'utilisation de Alert.alert** pour la compatibilité web
- **Feedback haptique** sur iOS pour une meilleure UX

## 🧪 Test de l'Application

### Tester l'authentification admin:
1. Lancer l'application
2. Aller dans Admin → Login
3. Entrer: `admin123`
4. Vérifier l'accès au tableau de bord

### Tester l'inscription membre:
1. Aller dans "Devenir Militant"
2. Remplir le formulaire d'inscription
3. Vérifier la création de la carte de membre
4. Télécharger la carte

## 📚 Documentation API

L'API backend est documentée via OpenAPI. Tous les endpoints sont accessibles via:
```
https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev
```

### Endpoints principaux:
- `/api/members/register` - Inscription des militants
- `/api/members/me` - Profil du membre connecté
- `/api/admin/members` - Gestion des membres (admin)
- `/api/admin/analytics` - Statistiques (admin)
- `/api/elections/submit-results` - Soumission de résultats électoraux

## 🛠️ Développement

### Installation des dépendances:
```bash
npm install
```

### Lancer l'application:
```bash
npx expo start
```

### Build pour production:
```bash
npx expo build:ios
npx expo build:android
```

## 📝 Notes Importantes

1. **Mot de passe admin:** Le mot de passe par défaut `admin123` doit être changé en production via les variables d'environnement du backend.

2. **Compatibilité web:** L'application utilise des composants compatibles web (Modal au lieu de Alert.alert).

3. **Stockage des credentials:** Les credentials admin sont stockés localement pour faciliter l'accès. En production, considérer une authentification plus robuste.

4. **Backend URL:** Le backend URL est configuré dans `app.json` et ne doit jamais être hardcodé dans le code.

---

Made with 💙 for creativity using [Natively.dev](https://natively.dev)
