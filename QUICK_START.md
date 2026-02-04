
# 🚀 Quick Start Guide - Member Management System

## Prerequisites
- Backend is deployed at: `https://9jhxnf8kze6atkt4nns335jz9jc2wdkb.app.specular.dev`
- Authentication is configured (Better Auth with email/password + Google + Apple OAuth)
- All member management endpoints are live

---

## 🎯 Testing the Application

### Step 1: Start the Development Server
```bash
npm start
```

Then choose your platform:
- Press `w` for web
- Press `i` for iOS simulator
- Press `a` for Android emulator

---

### Step 2: Admin Login (FIXED!)

The admin authentication system has been successfully integrated and is now working correctly.

#### Default Admin Credentials
- **Password:** `admin123`
- **Environment Variable:** `ADMIN_PASSWORD` (backend)

#### How to Login as Admin:

1. Navigate to `/admin/login`
2. Enter password: `admin123`
3. Click "Se connecter"
4. ✅ Success modal appears: "Connexion réussie ! Bienvenue dans l'espace administrateur."
5. ✅ Automatic redirect to `/admin/dashboard` after 1 second
6. ✅ Session persists across app restarts

#### Admin Features Available:
- **Dashboard** - View analytics and statistics
- **News Management** - Create, edit, delete news articles
- **Events Management** - Manage events
- **Leadership Management** - Manage party leadership
- **Member Management** - Manage members and roles
- **Member Registry** - View all registered members
- **Election Verification** - Verify election results
- **Media Upload** - Upload photos, videos, documents
- **Send Messages** - Send internal messages to members
- **Conference Management** - Manage video conferences

#### Technical Details:
The admin authentication uses a **dual-header verification** system:
1. Frontend stores `admin_password` and `admin_secret_code` in AsyncStorage/localStorage
2. API layer sends both `x-admin-password` and `x-admin-secret` headers with every admin request
3. Backend verifies that BOTH headers match the `ADMIN_PASSWORD` environment variable

---

### Step 3: Test Member Registration

1. Navigate to `/member/register` (or tap "Adhésion" tab)
2. Fill in the form:
   - **Nom Complet:** Jean Traoré
   - **NINA:** (optional) 123456789
   - **Commune:** Bamako
   - **Profession:** Enseignant
   - **Téléphone:** +223 70 00 00 00
   - **Email:** (optional) jean@example.com
3. Click "S'inscrire"
4. You should see success message with membership number
5. Navigate to `/member/card` to view digital card

---

### Step 4: Test Cotisation Payment

1. From member card, tap "Payer ma Cotisation"
2. Select payment type:
   - **Mensuelle:** 5,000 FCFA
   - **Annuelle:** 50,000 FCFA
   - **Montant Libre:** Custom amount
3. Select payment method (Orange Money, Moov Money, or Sama Money)
4. Click "Procéder au Paiement"
5. View payment instructions in modal

---

### Step 5: Test Internal Messages

1. From member card, tap "Messages Internes"
2. View list of messages (will be empty initially)
3. As admin, go to `/admin/send-message`
4. Send a test message:
   - **Titre:** Bienvenue
   - **Contenu:** Message de test pour tous les membres
   - Leave targeting fields empty (sends to all)
5. Click "Envoyer"
6. Go back to member messages to see the new message

---

### Step 6: Test Election Results Submission

1. From member card, tap "Module Sentinelle"
2. Fill in the form:
   - **Type d'Élection:** Présidentielle 2025
   - **Région:** Bamako
   - **Cercle:** Commune I
   - **Commune:** Badalabougou
   - **Bureau de Vote:** Bureau n°1
   - **Candidat 1 - Votes:** 150
   - **Candidat 2 - Votes:** 120
   - **Candidat 3 - Votes:** 80
   - **Votes Nuls:** 5
3. Click "Soumettre"
4. View success message with result ID

---

### Step 7: Test Admin Member Management

1. As admin, go to `/admin/dashboard`
2. Tap "Gérer les membres"
3. View list of all members
4. Use search to find specific members
5. Filter by status (pending, active, suspended)
6. Test actions:
   - **Approuver:** Activate a pending member
   - **Suspendre:** Suspend an active member
   - **Rôle:** Change member role

---

### Step 8: Test Admin Election Verification

1. As admin, go to `/admin/dashboard`
2. Tap "Vérifier résultats électoraux"
3. View pending election results
4. For each result:
   - View details (region, cercle, commune, bureau)
   - View vote counts
   - Click "Vérifier" to approve
   - Or click "Rejeter" to reject

---

## 🔍 Debugging Tips

### Check Console Logs
All API calls are logged with `[API]` prefix:
```
[API] Calling: https://...
[API] Success: {...}
```

### Check Network Tab (Web)
- Open browser DevTools → Network tab
- Filter by "Fetch/XHR"
- Check request/response for each API call

### Common Issues

**Issue:** "Backend URL not configured"
**Solution:** Check `app.json` → `expo.extra.backendUrl` is set

**Issue:** "Authentication token not found"
**Solution:** Sign in again, check SecureStore/localStorage

**Issue:** "API error: 401"
**Solution:** Token expired, sign out and sign in again

**Issue:** Modal not showing
**Solution:** Check `modalVisible` state and Modal component props

---

## 📱 Screen Navigation Map

```
Root
├── (tabs)
│   ├── (home) - Home screen
│   └── profile - Membership form (old)
├── /auth - Sign in/Sign up
├── /member
│   ├── /register - Member registration
│   ├── /card - Digital member card
│   ├── /cotisation - Payment screen
│   ├── /messages - Internal messages
│   └── /election-results - Submit results
└── /admin
    ├── /dashboard - Admin dashboard
    ├── /manage-members - Member management
    ├── /send-message - Send internal messages
    └── /election-verification - Verify elections
```

---

## 🎨 UI Components Used

- **Modal:** Custom modal for alerts/confirmations (web-compatible)
- **IconSymbol:** Cross-platform icons (SF Symbols on iOS, Material on Android)
- **LoadingButton:** Button with loading state
- **RefreshControl:** Pull-to-refresh functionality

---

## 🔐 Authentication Flow

1. User signs up/signs in → `/auth`
2. Token stored in SecureStore (native) or localStorage (web)
3. Token automatically included in all authenticated API calls
4. Session refreshes every 5 minutes
5. On sign out, token is cleared

---

## 📊 API Endpoints Summary

### Public Endpoints
- `POST /api/members/register` - Register new member
- `GET /api/members/card/{membershipNumber}` - Get member card (public verification)

### Protected Endpoints (Require Auth)
- `GET /api/members/me` - Get current user's member profile
- `PUT /api/members/me` - Update member profile
- `POST /api/cotisations/initiate` - Initiate payment
- `POST /api/cotisations/confirm` - Confirm payment
- `GET /api/cotisations/my-history` - Payment history
- `GET /api/messages/my-messages` - Get user's messages
- `POST /api/messages/mark-read/{messageId}` - Mark message as read
- `POST /api/elections/submit-results` - Submit election results
- `GET /api/elections/my-submissions` - Get user's submissions

### Admin Endpoints (Require Admin Role)
- `GET /api/admin/members` - Get all members
- `PUT /api/admin/members/{id}/status` - Update member status
- `PUT /api/admin/members/{id}/role` - Update member role
- `POST /api/admin/messages/send` - Send internal message
- `GET /api/admin/elections/pending` - Get pending results
- `PUT /api/admin/elections/{id}/verify` - Verify result
- `GET /api/admin/statistics` - Get admin statistics

---

## ✅ Testing Checklist

### Member Features
- [ ] Register new member
- [ ] View member card with QR code
- [ ] Initiate cotisation payment (monthly)
- [ ] Initiate cotisation payment (annual)
- [ ] Initiate cotisation payment (custom amount)
- [ ] View internal messages
- [ ] Mark message as read
- [ ] Submit election results

### Admin Features
- [ ] View all members
- [ ] Search members by name/number
- [ ] Filter members by status
- [ ] Approve pending member
- [ ] Suspend active member
- [ ] Reactivate suspended member
- [ ] Change member role
- [ ] Send message to all members
- [ ] Send message to specific role
- [ ] Send message to specific region
- [ ] View pending election results
- [ ] Verify election result
- [ ] Reject election result

### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google (web only)
- [ ] Sign in with Apple (iOS only)
- [ ] Session persists on reload
- [ ] Sign out clears session

---

## 🎉 You're All Set!

The member management system is fully integrated and ready to use. Follow the steps above to test all features.

**Need Help?**
- Check console logs for API call details
- Review `INTEGRATION_SUMMARY.md` for architecture details
- Check `utils/api.ts` for API helper functions
- Review `contexts/AuthContext.tsx` for authentication logic

**Happy Testing! 🚀**
