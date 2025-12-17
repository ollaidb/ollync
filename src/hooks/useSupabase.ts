import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
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

