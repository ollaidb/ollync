import { useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitialLoadRef = useRef(true)
  const lastActivityUpdateRef = useRef<number>(0)

  useEffect(() => {
    // Fonction pour vérifier et créer le profil si nécessaire
    const ensureProfileExists = async (user: User) => {
      try {
        console.log('🔍 Vérification du profil pour l\'utilisateur:', user.id, user.email)
        console.log('📋 Métadonnées utilisateur:', user.user_metadata)
        
        // Vérifier si le profil existe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profile) {
          console.log('✅ Profil existe déjà pour l\'utilisateur:', user.id)
          return
        }

        // Si le profil n'existe pas, le créer
        if (profileError && profileError.code === 'PGRST116') {
          console.log('⚠️ Profil non trouvé (code PGRST116), création en cours...')
          
          // Extraire les données depuis user_metadata (pour OAuth)
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null
          const username = user.user_metadata?.username || null
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

          console.log('📝 Données extraites:', { fullName, username, avatarUrl, email: user.email })

          // Créer le profil
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProfile, error: insertError } = await (supabase.from('profiles') as any)
            .insert({
              id: user.id,
              email: user.email || null,
              full_name: fullName,
              username: username,
              avatar_url: avatarUrl
            })
            .select()
            .single()

          if (insertError) {
            console.error('❌ Erreur lors de la création du profil:', insertError)
            console.error('Détails de l\'erreur:', JSON.stringify(insertError, null, 2))
          } else {
            console.log('✅ Profil créé avec succès pour l\'utilisateur OAuth:', newProfile)
          }
        } else if (profileError) {
          console.error('❌ Erreur inattendue lors de la vérification du profil:', profileError)
          console.error('Code d\'erreur:', profileError.code)
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du profil:', error)
        if (error instanceof Error) {
          console.error('Message d\'erreur:', error.message)
          console.error('Stack trace:', error.stack)
        }
      }
    }

    const updateLastActivity = async (userId: string) => {
      const now = Date.now()
      if (now - lastActivityUpdateRef.current < 60000) {
        return
      }
      lastActivityUpdateRef.current = now

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any)
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', userId)
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la dernière activité:', error)
      }
    }

    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Erreur lors de la récupération de la session:', error)
        setLoading(false)
        isInitialLoadRef.current = false
        return
      }

      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      // Ne pas bloquer le chargement pour ensureProfileExists
      // Le faire en arrière-plan pour ne pas bloquer l'application
      if (currentUser) {
        ensureProfileExists(currentUser).catch(err => {
          console.error('❌ Erreur lors de ensureProfileExists (non bloquant):', err)
        })
        updateLastActivity(currentUser.id).catch(err => {
          console.error('❌ Erreur lors de updateLastActivity (non bloquant):', err)
        })
      }
      
      setLoading(false)
      isInitialLoadRef.current = false
    }).catch((error) => {
      console.error('❌ Erreur lors de getSession:', error)
      setLoading(false)
      isInitialLoadRef.current = false
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Événement d\'authentification:', event, session?.user?.email || 'Pas de session')
      
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      // Vérifier et créer le profil si l'utilisateur vient de s'authentifier (en arrière-plan)
      if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('✅ Utilisateur authentifié, vérification du profil...')
        ensureProfileExists(currentUser).catch(err => {
          console.error('❌ Erreur lors de ensureProfileExists (non bloquant):', err)
        })
        updateLastActivity(currentUser.id).catch(err => {
          console.error('❌ Erreur lors de updateLastActivity (non bloquant):', err)
        })
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 Utilisateur déconnecté')
      }
      
      // Seulement mettre à jour loading si ce n'est pas le chargement initial
      // (pour éviter les conflits avec getSession)
      if (!isInitialLoadRef.current) {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    // Supprimer d'abord la session localement pour éviter les problèmes d'API
    // Réinitialiser l'état immédiatement
    setSession(null)
    setUser(null)
    
    // Supprimer toutes les données Supabase du storage
    if (typeof window !== 'undefined') {
      try {
        // Supprimer toutes les clés Supabase du localStorage
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Supprimer aussi du sessionStorage
        const sessionKeysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
      } catch (storageErr) {
        console.warn('Error clearing storage:', storageErr)
      }
    }
    
    // Essayer d'appeler l'API en arrière-plan (mais ignorer les erreurs)
    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {
        // Ignorer les erreurs d'API, on a déjà nettoyé localement
      })
    } catch (err) {
      // Ignorer complètement les erreurs, la déconnexion locale est déjà faite
      console.warn('SignOut API call failed, but local session cleared:', err)
    }
  }

  return {
    user,
    session,
    loading,
    signOut,
  }
}

