import { useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthSnapshot = {
  user: User | null
  session: Session | null
  loading: boolean
}

type AuthListener = (snapshot: AuthSnapshot) => void

let snapshot: AuthSnapshot = {
  user: null,
  session: null,
  loading: true
}

let initialized = false
let activeSubscribers = 0
const listeners = new Set<AuthListener>()
const profileEnsureQueue = new Set<string>()
const lastActivityByUser = new Map<string, number>()

const emit = () => {
  for (const listener of listeners) {
    listener(snapshot)
  }
}

const setSnapshot = (next: Partial<AuthSnapshot>) => {
  snapshot = { ...snapshot, ...next }
  emit()
}

const ensureProfileExists = async (user: User) => {
  if (profileEnsureQueue.has(user.id)) return
  profileEnsureQueue.add(user.id)

  try {
    const { data: profiles, error } = await supabase.from('profiles').select('id').eq('id', user.id).limit(1)
    if (error) return
    if ((profiles || []).length > 0) return

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null
    const username = user.user_metadata?.username || null
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .insert({
        id: user.id,
        email: user.email || null,
        full_name: fullName,
        username,
        avatar_url: avatarUrl
      })
      .select()
      .limit(1)
  } catch (err) {
    console.error('Error ensuring profile exists:', err)
  } finally {
    profileEnsureQueue.delete(user.id)
  }
}

const updateLastActivity = async (userId: string) => {
  const now = Date.now()
  const last = lastActivityByUser.get(userId) || 0
  if (now - last < 60_000) return
  lastActivityByUser.set(userId, now)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', userId)
  } catch (err) {
    console.error('Error updating last activity:', err)
  }
}

const hydrate = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error loading session:', error)
      setSnapshot({ loading: false, user: null, session: null })
      return
    }

    const session = data.session ?? null
    const user = session?.user ?? null
    setSnapshot({ session, user, loading: false })

    if (user) {
      void ensureProfileExists(user)
      void updateLastActivity(user.id)
    }
  } catch (err) {
    console.error('Error hydrating auth session:', err)
    setSnapshot({ loading: false, user: null, session: null })
  }
}

const initializeAuth = () => {
  if (initialized) return
  initialized = true

  void hydrate()

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    setSnapshot({ session: session ?? null, user, loading: false })

    if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
      void ensureProfileExists(user)
      void updateLastActivity(user.id)
    }
  })

  void data.subscription
}

const subscribe = (listener: AuthListener) => {
  listeners.add(listener)
  activeSubscribers += 1
  listener(snapshot)

  return () => {
    listeners.delete(listener)
    activeSubscribers = Math.max(0, activeSubscribers - 1)
    // Keep subscription alive while app runs; avoids auth re-init thrash.
  }
}

export const useAuth = () => {
  const [state, setState] = useState<AuthSnapshot>(snapshot)

  useEffect(() => {
    initializeAuth()
    return subscribe(setState)
  }, [])

  const signOut = async () => {
    setSnapshot({ session: null, user: null, loading: false })

    if (typeof window !== 'undefined') {
      try {
        const localKeys: string[] = []
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            localKeys.push(key)
          }
        }
        localKeys.forEach((key) => localStorage.removeItem(key))

        const sessionKeys: string[] = []
        for (let i = 0; i < sessionStorage.length; i += 1) {
          const key = sessionStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            sessionKeys.push(key)
          }
        }
        sessionKeys.forEach((key) => sessionStorage.removeItem(key))
      } catch (err) {
        console.warn('Error clearing auth storage:', err)
      }
    }

    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    } catch (err) {
      console.warn('SignOut API call failed, local state already cleared:', err)
    }
  }

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    signOut
  }
}
