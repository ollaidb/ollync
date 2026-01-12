# ✅ Checklist Complète : Configuration Apple OAuth

## 🔍 Vérifications à Faire

### 1. Supabase Dashboard - Configuration Apple

Allez dans **Authentication** → **Providers** → **Apple** et vérifiez :

- [ ] **Toggle Apple activé** : ON (vert)
- [ ] **Services ID (Client ID)** : `com.ollync.web` (exact, sans espaces)
- [ ] **Secret Key** : Champ rempli (masqué avec •••)
- [ ] **Key ID** : Rempli (10 caractères, ex: `CN6345M44T`)
- [ ] **Team ID** : Rempli (10 caractères, ex: `WR5724DCAN`)

### 2. Format de la Secret Key

La Secret Key doit être le **contenu COMPLET du fichier .p8** :

- [ ] Commence par `-----BEGIN PRIVATE KEY-----`
- [ ] Se termine par `-----END PRIVATE KEY-----`
- [ ] Contient plusieurs lignes entre les deux
- [ ] Pas d'espaces supplémentaires au début/fin
- [ ] Fait environ 800-900 caractères (normal)

### 3. Apple Developer Portal - Services ID

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Trouvez `com.ollync.web` (Services ID)
4. Cliquez dessus

Vérifications :

- [ ] **Sign in with Apple** est coché
- [ ] Cliquez sur **Configure** à côté de "Sign in with Apple"
- [ ] **Primary App ID** est sélectionné
- [ ] **Domains and Subdomains** : `ollync.app` (sans www)
- [ ] **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback` (exact, sans slash final)

### 4. Apple Developer Portal - Key

1. **Certificates, Identifiers & Profiles** → **Keys**
2. Trouvez votre clé (ex: "Ollync Sign in with Apple")

Vérifications :

- [ ] La clé existe
- [ ] **Key ID** est visible (10 caractères)
- [ ] **Sign in with Apple** est coché
- [ ] Avez-vous le fichier `.p8` téléchargé ? (si non, créez une nouvelle clé)

### 5. Team ID

1. Dans Apple Developer Portal, cliquez sur votre nom (en haut à droite)
2. Votre **Team ID** s'affiche

Vérifications :

- [ ] Team ID est noté (10 caractères)
- [ ] Team ID dans Supabase = Team ID dans Apple Developer Portal

### 6. Logs Supabase

1. **Supabase Dashboard** → **Logs** → **Auth**
2. Testez la connexion Apple
3. Regardez les logs immédiatement

Vérifications :

- [ ] Y a-t-il des erreurs récentes ?
- [ ] Quel est le message d'erreur exact ?
- [ ] L'erreur mentionne-t-elle "apple", "invalid_client", "JWT", ou "500" ?

### 7. Console du Navigateur

1. Ouvrez votre application
2. Ouvrez la Console (F12 → Console)
3. Testez la connexion Apple

Vérifications :

- [ ] Y a-t-il des erreurs dans la console ?
- [ ] Quelle est l'erreur exacte ?
- [ ] L'erreur est-elle 500, 400, ou autre ?

## 🚨 Si Tout Est Vérifié Mais Ça Ne Marche Toujours Pas

Si tous les éléments ci-dessus sont corrects mais que ça ne fonctionne toujours pas :

1. **Créez une nouvelle Key** dans Apple Developer Portal
2. **Téléchargez le fichier .p8** immédiatement
3. **Notez le nouveau Key ID**
4. **Mettez à jour Supabase** avec :
   - Le nouveau Key ID
   - Le contenu complet du nouveau fichier .p8
5. **Testez à nouveau**

## 📝 Informations à Me Fournir

Si le problème persiste, donnez-moi :

1. **Screenshot de la configuration Apple dans Supabase** (Authentication → Providers → Apple)
2. **Message d'erreur exact des logs Supabase** (Logs → Auth)
3. **Message d'erreur exact de la console du navigateur** (F12 → Console)
4. **Confirmation** : Avez-vous vérifié tous les éléments de cette checklist ?
