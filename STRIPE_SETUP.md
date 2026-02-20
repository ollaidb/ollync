# Stripe Setup (Supabase + Ollync)

Ce guide configure les paiements Stripe pour les boosts / placements sponsorises.

## 1) Points importants

- Ne partage jamais ta cle secrete Stripe dans le chat.
- Les formats valides:
  - Cle publique: `pk_test_...` ou `pk_live_...`
  - Cle secrete: `sk_test_...` ou `sk_live_...`
  - Webhook secret: `whsec_...`

La valeur envoyee `xztl-qkup-etgw-lsao-ngtf` n'est pas une cle Stripe valide.

## 2) Base de donnees (Supabase)

1. Ouvre l'editeur SQL Supabase.
2. Execute `supabase/add_stripe_payments.sql`.
3. Execute `supabase/add_post_promotion_columns.sql`.

Cela cree:
- `payment_products`
- `stripe_customers`
- `payment_orders`
- `payment_events`
- Colonnes de promotion sur `posts` (`boosted_until`, `sponsored_until`)

Et ajoute des produits par defaut (`BOOST_24H`, `BOOST_7D`, etc.).

## 3) Deployer les edge functions

Fonctions ajoutees:
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

Commandes:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 4) Secrets Supabase Functions

Ajoute ces secrets:

```bash
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set APP_BASE_URL=https://ton-domaine.com
```

## 5) Configurer Stripe Dashboard

1. Cree tes produits/prix Stripe (si tu veux utiliser des `stripe_price_id`).
2. Optionnel: mets `stripe_price_id` dans `payment_products`.
3. Cree un endpoint webhook Stripe:
   - URL: `https://<project-ref>.functions.supabase.co/stripe-webhook`
   - Evenements minimum:
     - `checkout.session.completed`
     - `checkout.session.expired`
4. Recupere le secret webhook (`whsec_...`) et mets-le dans `STRIPE_WEBHOOK_SECRET`.

## 6) Lancer un paiement depuis l'app

Helper frontend ajoute:
- `src/lib/stripePayments.ts`

Exemple:

```ts
import { redirectToStripeCheckout } from '../lib/stripePayments'

await redirectToStripeCheckout({
  productCode: 'BOOST_24H',
  quantity: 1,
  metadata: { post_id: 'UUID_DE_ANNONCE' }
})
```

## 7) Cycle de paiement

1. L'app appelle `create-checkout-session`.
2. La fonction cree `payment_orders` en `pending` + session Stripe.
3. Redirection utilisateur vers Stripe Checkout.
4. Stripe envoie le webhook.
5. `stripe-webhook` marque la commande en `paid` ou `expired`.
6. Si `metadata.post_id` est fourni, le webhook active automatiquement le boost/sponsor sur `posts`.

## 8) Verifications

- Table `payment_orders`: statut change apres paiement.
- Table `payment_events`: events logs enregistres.
- URL de retour:
  - Success: `/profile/wallet?payment=success&order_id=...`
  - Cancel: `/profile/wallet?payment=cancel&order_id=...`

## 9) Etape suivante recommandee
Connecter le tri d'affichage des feeds avec `boosted_until`/`sponsored_until`.
