import { Shield } from 'lucide-react'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl text-white">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-white">Politique de Confidentialité</h1>
          </div>

          <div className="space-y-6 text-white/90">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Collecte des Données</h2>
              <p>
                Notre application Panel Roblox collecte uniquement les données nécessaires au bon fonctionnement
                de l'application et à l'accès aux APIs Roblox via OAuth 2.0.
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Informations de profil Roblox (nom d'utilisateur, ID utilisateur)</li>
                <li>Tokens OAuth 2.0 (stockés de manière sécurisée)</li>
                <li>Statistiques de jeux Roblox (visites, revenus, engagement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Utilisation des Données</h2>
              <p>Les données collectées sont utilisées pour :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Afficher les statistiques de vos jeux Roblox</li>
                <li>Permettre l'authentification via OAuth 2.0</li>
                <li>Accéder aux APIs Roblox Open Cloud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Stockage et Sécurité</h2>
              <p>
                Vos données sont stockées localement sur votre serveur. Les tokens OAuth sont stockés
                de manière sécurisée et ne sont jamais partagés avec des tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Partage des Données</h2>
              <p>
                Nous ne partageons JAMAIS vos données avec des tiers. Les données sont uniquement
                utilisées pour communiquer avec les APIs officielles Roblox.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Vos Droits</h2>
              <p>Vous pouvez à tout moment :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Révoquer l'accès OAuth depuis les paramètres</li>
                <li>Supprimer votre configuration</li>
                <li>Effacer le cache des données</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Cookies et Technologies Similaires</h2>
              <p>
                L'application utilise le stockage local du navigateur pour mémoriser vos préférences.
                Aucun cookie de suivi n'est utilisé.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Contact</h2>
              <p>
                Pour toute question concernant cette politique de confidentialité,
                contactez l'administrateur de cette instance.
              </p>
            </section>

            <section className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
              <p className="text-blue-200 text-sm">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
            </section>
          </div>

          <div className="mt-8">
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              ← Retour au Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
