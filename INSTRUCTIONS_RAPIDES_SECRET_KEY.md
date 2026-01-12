# ⚡ Instructions Rapides : Corriger la Secret Key Apple

## 🎯 Action Immédiate

1. **Trouvez le fichier .p8** (ou créez-en un nouveau dans Apple Developer Portal)
2. **Ouvrez-le** dans un éditeur de texte
3. **Copiez TOUT** (Cmd+A puis Cmd+C)
4. **Dans Supabase** → Authentication → Providers → Apple → Secret Key
5. **Collez** (remplacez tout)
6. **Sauvegardez**
7. **Testez**

## ✅ Format Correct

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEG...
(lignes supplémentaires)
...
-----END PRIVATE KEY-----
```

**Doit avoir BEGIN et END !**

## ❓ Questions

- Avez-vous le fichier .p8 ? → Si NON, créez une nouvelle Key
- Le format est correct ? → Doit commencer par `-----BEGIN PRIVATE KEY-----`
- Avez-vous sauvegardé ? → Cliquez sur Save dans Supabase

**C'est tout ! Testez après avoir fait ça.**
