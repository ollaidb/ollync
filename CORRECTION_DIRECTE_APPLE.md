# Correction Directe - Apple OAuth

## JWT à Mettre dans Supabase

```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkNONjM0NU00NFQifQ.eyJpc3MiOiJXUjU3MjREQ0FOIiwiaWF0IjoxNzY4MTg4MzMwLCJleHAiOjE3ODM3NDAzMzAsImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20ub2xseW5jLndlYiJ9.G9SeLm2CnWTZThaCFYife9b4r6w_D71nPHhkq6sYwThbVlrGIyK3z2dO_-107-XiZ_lj0U8H_Kil8y-VwGEW7w
```

## Actions Directes

1. **Supabase** → Authentication → Providers → Apple → Secret Key → Collez le JWT ci-dessus → Save

2. **Apple Developer Portal** → Identifiers → `com.ollync.web` → Configure (à côté de Sign in with Apple) → Return URLs doit être : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback` → Save

3. **Testez** la connexion Apple

Si l'erreur 500 persiste, vérifiez les logs Supabase (Logs → Auth) et donnez-moi l'erreur exacte.
