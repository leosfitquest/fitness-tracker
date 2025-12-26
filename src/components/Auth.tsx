import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Handle password recovery from email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        const newPassword = prompt('🔐 Neues Passwort eingeben (min. 6 Zeichen):')
        if (newPassword && newPassword.length >= 6) {
          supabase.auth.updateUser({ password: newPassword })
            .then(({ error }) => {
              if (error) {
                setMessage({ type: 'error', text: error.message })
              } else {
                setMessage({ type: 'success', text: '✅ Passwort erfolgreich geändert!' })
              }
            })
        } else if (newPassword) {
          setMessage({ type: 'error', text: '❌ Passwort muss mindestens 6 Zeichen haben' })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        })
        if (error) throw error
        setMessage({ type: 'success', text: '✅ Check your email for confirmation link!' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage({ type: 'success', text: '✅ Login erfolgreich!' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage({ type: 'error', text: '❌ Bitte Email-Adresse eingeben' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      })
      if (error) throw error
      setMessage({ type: 'success', text: '📧 Password-Reset-Link wurde an deine Email geschickt!' })
      setIsResetMode(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-emerald-400">💪 FitTracker</h1>
          <p className="text-slate-400 mt-2">
            {isResetMode 
              ? 'Passwort zurücksetzen' 
              : isSignUp 
                ? 'Create your account' 
                : 'Welcome back'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`rounded-lg p-3 text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
              : 'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}>
            {message.text}
          </div>
        )}

        <form 
          onSubmit={isResetMode ? handleResetPassword : handleAuth} 
          className="bg-slate-900 rounded-xl p-8 space-y-6 border border-slate-800"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          {!isResetMode && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading 
              ? 'Loading...' 
              : isResetMode 
                ? '📧 Reset-Link senden'
                : isSignUp 
                  ? 'Sign Up' 
                  : 'Sign In'}
          </button>

          {!isSignUp && !isResetMode && (
            <button
              type="button"
              onClick={() => setIsResetMode(true)}
              className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              🔑 Passwort vergessen?
            </button>
          )}

          {isResetMode && (
            <button
              type="button"
              onClick={() => setIsResetMode(false)}
              className="w-full text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Zurück zum Login
            </button>
          )}

          {!isResetMode && (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
        </form>

        {/* Google Login */}
        {!isResetMode && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-slate-950 text-slate-500">Or continue with</span>
            </div>
          </div>
        )}

        {!isResetMode && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-slate-900 py-3 px-4 text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 border border-slate-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        )}
      </div>
    </div>
  )
}
