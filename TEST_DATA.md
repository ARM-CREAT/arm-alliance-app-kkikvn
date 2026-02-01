
# 🧪 Test Data for Member Management System

Use this test data to quickly populate your application for testing.

---

## 👤 Test Admin Account

**Email:** admin@arm.ml  
**Password:** admin123  
**Name:** Administrateur ARM  
**Role:** administrateur

---

## 👥 Test Members

### Member 1 - Militant
**Nom Complet:** Amadou Diarra  
**NINA:** 123456789  
**Commune:** Bamako  
**Profession:** Enseignant  
**Téléphone:** +223 70 11 22 33  
**Email:** amadou.diarra@example.com  
**Role:** militant  
**Status:** active

### Member 2 - Collecteur
**Nom Complet:** Fatoumata Traoré  
**NINA:** 987654321  
**Commune:** Sikasso  
**Profession:** Commerçante  
**Téléphone:** +223 70 44 55 66  
**Email:** fatoumata.traore@example.com  
**Role:** collecteur  
**Status:** active

### Member 3 - Superviseur
**Nom Complet:** Ibrahim Koné  
**NINA:** 456789123  
**Commune:** Ségou  
**Profession:** Ingénieur  
**Téléphone:** +223 70 77 88 99  
**Email:** ibrahim.kone@example.com  
**Role:** superviseur  
**Status:** active

### Member 4 - Pending
**Nom Complet:** Mariam Coulibaly  
**NINA:** 789123456  
**Commune:** Kayes  
**Profession:** Infirmière  
**Téléphone:** +223 70 00 11 22  
**Email:** mariam.coulibaly@example.com  
**Role:** militant  
**Status:** pending

---

## 💰 Test Cotisations

### Monthly Payment
**Amount:** 5,000 FCFA  
**Type:** monthly  
**Payment Method:** orange_money  
**Transaction ID:** OM-2025-001

### Annual Payment
**Amount:** 50,000 FCFA  
**Type:** annual  
**Payment Method:** moov_money  
**Transaction ID:** MM-2025-002

### Custom Payment
**Amount:** 10,000 FCFA  
**Type:** one-time  
**Payment Method:** sama_money  
**Transaction ID:** SM-2025-003

---

## 📧 Test Internal Messages

### Message 1 - All Members
**Titre:** Bienvenue à l'Alliance A.R.M  
**Contenu:** Nous sommes heureux de vous accueillir au sein de notre parti. Ensemble, nous construirons un Mali meilleur.  
**Target Role:** (empty - all members)  
**Target Region:** (empty)  
**Target Cercle:** (empty)  
**Target Commune:** (empty)

### Message 2 - Militants Only
**Titre:** Réunion des Militants  
**Contenu:** Une réunion importante aura lieu le 15 février 2025 à 14h au siège du parti. Présence obligatoire.  
**Target Role:** militant  
**Target Region:** (empty)  
**Target Cercle:** (empty)  
**Target Commune:** (empty)

### Message 3 - Bamako Region
**Titre:** Événement à Bamako  
**Contenu:** Grand rassemblement le 20 février 2025 au stade Modibo Keïta. Tous les membres de Bamako sont invités.  
**Target Role:** (empty)  
**Target Region:** Bamako  
**Target Cercle:** (empty)  
**Target Commune:** (empty)

### Message 4 - Collecteurs
**Titre:** Formation des Collecteurs  
**Contenu:** Session de formation pour tous les collecteurs le 25 février 2025. Inscription obligatoire.  
**Target Role:** collecteur  
**Target Region:** (empty)  
**Target Cercle:** (empty)  
**Target Commune:** (empty)

---

## 🗳️ Test Election Results

### Result 1 - Bamako
**Type d'Élection:** Présidentielle 2025  
**Région:** Bamako  
**Cercle:** Commune I  
**Commune:** Badalabougou  
**Bureau de Vote:** Bureau n°1  
**Résultats:**
- Candidat 1: 250 votes
- Candidat 2: 180 votes
- Candidat 3: 120 votes
- Votes Nuls: 10

**PV Photo URL:** https://example.com/pv-bamako-1.jpg  
**Status:** pending

### Result 2 - Sikasso
**Type d'Élection:** Présidentielle 2025  
**Région:** Sikasso  
**Cercle:** Sikasso  
**Commune:** Sikasso Centre  
**Bureau de Vote:** Bureau n°5  
**Résultats:**
- Candidat 1: 300 votes
- Candidat 2: 220 votes
- Candidat 3: 150 votes
- Votes Nuls: 15

**PV Photo URL:** https://example.com/pv-sikasso-5.jpg  
**Status:** pending

### Result 3 - Ségou
**Type d'Élection:** Présidentielle 2025  
**Région:** Ségou  
**Cercle:** Ségou  
**Commune:** Ségou Centre  
**Bureau de Vote:** Bureau n°3  
**Résultats:**
- Candidat 1: 200 votes
- Candidat 2: 160 votes
- Candidat 3: 100 votes
- Votes Nuls: 8

**PV Photo URL:** (empty)  
**Status:** pending

---

## 🗺️ Geographic Data (Mali)

### Regions
1. **Bamako** (Capital)
2. **Kayes**
3. **Koulikoro**
4. **Sikasso**
5. **Ségou**
6. **Mopti**
7. **Tombouctou**
8. **Gao**
9. **Kidal**
10. **Ménaka**
11. **Taoudénit**

### Sample Cercles (Bamako)
- Commune I
- Commune II
- Commune III
- Commune IV
- Commune V
- Commune VI

### Sample Communes (Commune I)
- Badalabougou
- Djélibougou
- Doumanzana
- Banconi
- Boulkassoumbougou

---

## 🎭 Test Scenarios

### Scenario 1: New Member Registration
1. User registers as new member
2. Receives membership number (ARM-2025-XXXXX)
3. Views digital member card with QR code
4. Status is "pending" initially
5. Admin approves member
6. Status changes to "active"

### Scenario 2: Cotisation Payment
1. Active member initiates monthly payment (5,000 FCFA)
2. Selects Orange Money as payment method
3. Receives payment instructions
4. Completes payment via USSD
5. Confirms payment with transaction ID
6. Payment recorded in history

### Scenario 3: Internal Communication
1. Admin sends message to all militants
2. Message appears in militants' message inbox
3. Militant opens message
4. Message marked as read
5. Unread badge disappears

### Scenario 4: Election Surveillance
1. Member submits election results from Bureau n°1
2. Results stored with status "pending"
3. Admin views pending results
4. Admin verifies results
5. Status changes to "verified"
6. Results published

### Scenario 5: Member Role Upgrade
1. Militant performs well
2. Admin changes role to "collecteur"
3. Member receives new permissions
4. Member can now collect cotisations
5. Member receives targeted messages for collecteurs

---

## 📊 Expected Statistics (After Test Data)

**Total Members:** 4  
**Active Members:** 3  
**Pending Members:** 1  
**Suspended Members:** 0

**Members by Role:**
- Militants: 2
- Collecteurs: 1
- Superviseurs: 1
- Administrateurs: 1

**Members by Region:**
- Bamako: 1
- Sikasso: 1
- Ségou: 1
- Kayes: 1

**Total Cotisations:** 65,000 FCFA  
**Pending Election Results:** 3  
**Verified Election Results:** 0

---

## 🔄 Quick Test Script

### 1. Setup (5 minutes)
```
1. Create admin account
2. Sign in as admin
3. Navigate to admin dashboard
```

### 2. Member Registration (10 minutes)
```
1. Register 4 test members (use data above)
2. View members in admin panel
3. Approve 3 members
4. Leave 1 pending
```

### 3. Cotisations (5 minutes)
```
1. Sign in as Member 1
2. Initiate monthly payment
3. View payment instructions
4. Sign in as Member 2
5. Initiate annual payment
```

### 4. Messages (5 minutes)
```
1. Sign in as admin
2. Send message to all members
3. Send message to militants only
4. Sign in as Member 1
5. View messages
6. Mark as read
```

### 5. Elections (10 minutes)
```
1. Sign in as Member 1
2. Submit election results (Bamako)
3. Sign in as Member 2
4. Submit election results (Sikasso)
5. Sign in as admin
6. View pending results
7. Verify one result
8. Reject one result
```

### 6. Member Management (5 minutes)
```
1. Sign in as admin
2. Search for member by name
3. Filter by status (active)
4. Change Member 1 role to "collecteur"
5. Suspend Member 3
6. Reactivate Member 3
```

**Total Test Time:** ~40 minutes

---

## ✅ Validation Checklist

After running the test script, verify:

- [ ] All 4 members registered successfully
- [ ] Membership numbers generated (ARM-2025-XXXXX format)
- [ ] QR codes displayed on member cards
- [ ] 3 members approved, 1 pending
- [ ] 2 cotisations initiated
- [ ] Payment instructions displayed
- [ ] 2 messages sent
- [ ] Messages appear in member inboxes
- [ ] Unread badges work correctly
- [ ] 2 election results submitted
- [ ] Results appear in admin verification panel
- [ ] 1 result verified, 1 rejected
- [ ] Member role changed successfully
- [ ] Member suspended and reactivated
- [ ] Statistics updated correctly

---

## 🎉 Test Data Ready!

Use this test data to thoroughly test all features of the member management system.

**Pro Tip:** Create a test account for each role (militant, collecteur, superviseur, administrateur) to test role-based features.

**Happy Testing! 🚀**
