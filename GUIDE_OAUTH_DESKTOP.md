# Guide : Connexion Google/Apple OK sur mobile, erreur 500 sur ordinateur

## Problème

- Connexion Google et Apple fonctionne sur **téléphone**.
- Sur **ordinateur**, après avoir choisi Google ou Apple, la redirection vers Supabase renvoie une **erreur 500** (« Unexpected failure ») sur l’URL `/auth/v1/callback`.

## Cause la plus probable

Sur ordinateur, l’**URL d’origine** (celle où vous ouvrez l’app) ou l’**URL de redirection** après connexion n’est pas autorisée dans Supabase ou chez le fournisseur (Google/Apple). Si Supabase ne peut pas rediriger vers une URL autorisée, il peut répondre 500.

Autres causes possibles : cookies / stockage bloqués sur desktop (PKCE), ou configuration Apple (JWT) qui échoue dans certains contextes.

---

## 1. Supabase – Redirect URLs (prioritaire)

Supabase n’accepte de rediriger que vers les URLs listées. Il faut y mettre **toutes** les origines utilisées sur ordinateur.

1. Allez sur [Supabase Dashboard](https://app.supabase.com/) → votre projet.
2. **Authentication** → **URL Configuration**.
3. Dans **Redirect URLs**, assurez-vous d’avoir **au moins** :
   - `https://ollync.app/**`
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:5173/**`
   - `http://127.0.0.1:3000/**`
4. **Site URL** : en production, mettez `https://ollync.app` (sans `www` sauf si vous utilisez www).
5. Enregistrez.

Si vous testez sur ordinateur avec une autre URL (ex. un autre domaine ou port), ajoutez-la aussi en `https://votredomaine.com/**` ou `http://localhost:PORT/**`.

---

## 2. Google Cloud Console – origines autorisées

Sur ordinateur, vous devez utiliser une URL déclarée chez Google.

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Ouvrez votre **OAuth 2.0 Client ID** (type « Web application »).
3. **Authorized JavaScript origins** doit contenir **exactement** l’URL que vous utilisez sur desktop, par exemple :
   - `https://ollync.app`
   - `http://localhost:5173`
   - `http://localhost:3000`
4. **Authorized redirect URIs** doit contenir (sans slash final) :
   - `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
5. Enregistrez.

Important : si vous ouvrez le site en `https://www.ollync.app` sur desktop, ajoutez aussi `https://www.ollync.app` dans les origines. Sinon, utilisez toujours `https://ollync.app` (sans www).

---

## 3. Vérifier l’URL utilisée sur ordinateur

- Sur **mobile**, vous utilisez sans doute `https://ollync.app` → ça marche.
- Sur **ordinateur**, ouvrez l’app et regardez la barre d’adresse :
  - Si c’est `http://localhost:5173` ou `http://127.0.0.1:3000`, etc., cette origine (et les Redirect URLs correspondantes) doit être dans Supabase et, pour Google, dans Authorized JavaScript origins.
  - Si c’est `https://www.ollync.app`, ajoutez `https://www.ollync.app` partout où vous avez mis `https://ollync.app`, ou utilisez uniquement `https://ollync.app`.

---

## 4. Consulter les logs Supabase (pour l’erreur exacte)

L’erreur 500 est générique. La vraie cause apparaît dans les logs Auth.

1. Supabase Dashboard → **Logs** → **Auth**.
2. Lancez une connexion Google ou Apple **depuis l’ordinateur**.
3. Regardez la dernière entrée après l’échec et notez le message d’erreur (ex. `redirect_url not allowed`, `invalid_request`, etc.).

Cela permet de savoir si le problème vient des Redirect URLs, du provider (Google/Apple) ou d’autre chose.

---

## 5. Cookies et stockage (desktop)

Sur certains navigateurs ou profils (mode privé, paramètres stricts), les cookies ou le `localStorage` peuvent être bloqués. Supabase utilise un « code_verifier » (PKCE) stocké avant la redirection ; s’il est perdu, le callback peut échouer côté serveur (parfois en 500).

- Tester dans une **fenêtre normale** (pas navigation privée).
- Désactiver temporairement les extensions qui bloquent les cookies (ex. bloqueurs de pub).
- Tester dans un **autre navigateur** (Chrome, Firefox, Safari) pour voir si le comportement change.

---

## 6. Apple uniquement – si l’erreur 500 ne concerne qu’Apple sur desktop

Si Google marche sur desktop mais pas Apple, en plus des points ci‑dessus :

- Vérifier **Authentication** → **Providers** → **Apple** dans Supabase (Services ID, Secret Key / JWT, Key ID, Team ID) comme décrit dans `SOLUTION_ERREUR_500_APPLE.md`.
- Vérifier dans Apple Developer Portal que la **Return URL** est exactement :  
  `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`  
  (remplacez par l’URL de votre projet Supabase si différente.)

---

## Checklist rapide

- [ ] **Supabase** → Redirect URLs contient l’URL exacte utilisée sur ordinateur (ex. `https://ollync.app/**`, `http://localhost:5173/**`, etc.).
- [ ] **Supabase** → Site URL cohérent avec l’URL d’ouverture (ex. `https://ollync.app`).
- [ ] **Google** → Authorized JavaScript origins contient l’URL d’ouverture sur desktop (ex. `https://ollync.app`, `http://localhost:5173`).
- [ ] **Google** → Authorized redirect URIs contient l’URL callback Supabase.
- [ ] Test sur ordinateur en **fenêtre normale**, sans extension qui bloque les cookies.
- [ ] **Logs Supabase** (Auth) consultés après un échec pour noter l’erreur exacte.

En commençant par les **Redirect URLs** dans Supabase et l’**URL exacte** utilisée sur ordinateur, l’erreur 500 au callback disparaît souvent. Si après ces réglages l’erreur persiste, le message précis dans les logs Auth permettra de cibler la suite (Google, Apple, ou PKCE/cookies).
