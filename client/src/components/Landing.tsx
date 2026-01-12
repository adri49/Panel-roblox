import { BarChart3, Shield, Users, Zap } from 'lucide-react'

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-lg">
              <BarChart3 className="w-20 h-20 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            Panel Roblox
          </h1>
          <p className="text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Visualisez et gérez les statistiques de vos jeux Roblox en temps réel
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/login"
              className="bg-white text-purple-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-100 transition-all shadow-2xl"
            >
              Se Connecter
            </a>
            <a
              href="/register"
              className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-2xl border-2 border-white/20"
            >
              Créer un Compte
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl w-fit mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Statistiques en Temps Réel</h3>
            <p className="text-white/80">
              Suivez les visites, joueurs actifs et revenus de vos jeux Roblox en temps réel
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl w-fit mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">OAuth 2.0 Sécurisé</h3>
            <p className="text-white/80">
              Connexion sécurisée via OAuth 2.0, recommandé par Roblox. Vos données restent privées.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl w-fit mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Gestion d'Équipe</h3>
            <p className="text-white/80">
              Partagez l'accès avec votre équipe. Gérez les permissions et collaborez facilement.
            </p>
          </div>
        </div>

        {/* Features Details */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <Zap className="w-12 h-12 text-yellow-400" />
            <h2 className="text-4xl font-bold text-white">Fonctionnalités</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Dashboard Complet</h4>
                <p className="text-white/70">Visualisez toutes vos statistiques en un coup d'œil</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Suivi des Ventes</h4>
                <p className="text-white/70">Analysez vos transactions et revenus détaillés</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Multi-Jeux</h4>
                <p className="text-white/70">Gérez plusieurs jeux depuis une seule interface</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Actualisation Auto</h4>
                <p className="text-white/70">Données mises à jour automatiquement toutes les minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Travail d'Équipe</h4>
                <p className="text-white/70">Invitez des membres et gérez les permissions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">APIs Roblox Officielles</h4>
                <p className="text-white/70">Utilise uniquement les APIs officielles Roblox</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 border-2 border-white/20">
          <h2 className="text-4xl font-bold text-white mb-4">
            Prêt à Commencer ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Créez votre compte gratuitement et commencez à suivre vos statistiques
          </p>
          <a
            href="/register"
            className="inline-block bg-white text-purple-900 px-10 py-4 rounded-xl font-bold text-xl hover:bg-purple-100 transition-all shadow-2xl"
          >
            Créer un Compte Gratuit
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-white/70">
            <a href="/privacy" className="hover:text-white transition-colors">
              Politique de Confidentialité
            </a>
            <span>•</span>
            <a href="/terms" className="hover:text-white transition-colors">
              Conditions d'Utilisation
            </a>
          </div>
          <p className="text-center text-white/50 mt-4">
            © 2026 Panel Roblox - Non affilié à Roblox Corporation
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
