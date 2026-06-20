import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchSubscription(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchSubscription(session.user.id)
        else {
          setSubscription(null)
          setLoading(false)
        }
      }
    )

    return () => authSub.unsubscribe()
  }, [])

  async function fetchSubscription(userId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .or('status.in.(active,trialing),is_comp.eq.true')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setSubscription(data ?? null)
    setLoading(false)
  }

  async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.is_comp === true

  return (
    <AuthContext.Provider value={{
      user,
      subscription,
      loading,
      isSubscribed,
      signInWithEmail,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
