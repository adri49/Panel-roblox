import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Mail, User, Lock, AlertCircle, CheckCircle } from 'lucide-react'

const Register = () => {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide')
      return
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      setError('Le nom d\'utilisateur doit contenir 3-20 caractères (lettres, chiffres, _ ou -)')
      return
    }

    setLoading(true)

    try {
      await register(email, username, password)
      // Redirection automatique après register via AuthContext
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white/20 p-4 rounded-2xl mb-4">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Créer un Compte</h1>
            <p className="text-white/70">Rejoignez Panel Roblox aujourd'hui</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white font-semibold mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="username"
                  pattern="[a-zA-Z0-9_-]{3,20}"
                  title="3-20 caractères (lettres, chiffres, _ ou -)"
                  required
                />
              </div>
              <p className="text-white/50 text-xs mt-1">
                3-20 caractères (lettres, chiffres, _ ou -)
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <p className="text-white/50 text-xs mt-1">
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
              <div className="text-blue-200 text-sm">
                <p className="font-semibold mb-1">En créant un compte :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Une équipe personnelle sera créée automatiquement</li>
                  <li>Vous pourrez inviter des membres à votre équipe</li>
                  <li>Vos données restent privées et sécurisées</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer mon Compte'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Déjà un compte ?{' '}
              <a href="/login" className="text-white font-semibold hover:underline">
                Se connecter
              </a>
            </p>
          </div>

          <div className="mt-4 text-center">
            <a href="/" className="text-white/70 text-sm hover:text-white transition-colors">
              ← Retour à l'accueil
            </a>
          </div>

          {/* Legal */}
          <p className="text-white/50 text-xs text-center mt-6">
            En créant un compte, vous acceptez nos{' '}
            <a href="/terms" className="underline hover:text-white" target="_blank">
              Conditions d'Utilisation
            </a>{' '}
            et notre{' '}
            <a href="/privacy" className="underline hover:text-white" target="_blank">
              Politique de Confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
