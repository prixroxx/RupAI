import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate logged in user
      setUser({
        id: 'demo-user',
        email: 'demo@example.com',
        user_metadata: { full_name: 'Demo User' }
      } as User)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate successful signup
      return { 
        data: { user: { email, user_metadata: { full_name: fullName } } }, 
        error: null 
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate successful signin
      const demoUser = {
        id: 'demo-user',
        email,
        user_metadata: { full_name: 'Demo User' }
      } as User
      setUser(demoUser)
      return { data: { user: demoUser }, error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo mode - simulate signout
      setUser(null)
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }
}