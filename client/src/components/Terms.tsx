import { FileText } from 'lucide-react'

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-white">Conditions d'Utilisation</h1>
          </div>

          <div className="space-y-6 text-white/90">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Acceptation des Conditions</h2>
              <p>
                En utilisant Panel Roblox, vous acceptez ces conditions d'utilisation.
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Description du Service</h2>
              <p>
                Panel Roblox est une application de visualisation de statistiques pour vos jeux Roblox.
                Elle permet d'accéder aux données via :
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>OAuth 2.0 (méthode recommandée)</li>
                <li>Clés API Roblox Open Cloud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Responsabilités de l'Utilisateur</h2>
              <p>Vous vous engagez à :</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Utiliser l'application conformément aux Conditions d'Utilisation de Roblox</li>
                <li>Protéger vos identifiants OAuth et clés API</li>
                <li>Ne pas tenter de compromettre la sécurité de l'application</li>
                <li>Respecter les limites de taux (rate limits) des APIs Roblox</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Conformité Roblox</h2>
              <p>
                Cette application utilise les APIs officielles Roblox et respecte :
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Les Conditions d'Utilisation de Roblox</li>
                <li>Les directives d'utilisation des APIs Open Cloud</li>
                <li>Les politiques OAuth 2.0 de Roblox</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Limitations de Responsabilité</h2>
              <p>
                L'application est fournie "en l'état". Nous ne garantissons pas :
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>La disponibilité continue du service</li>
                <li>L'exactitude absolue des statistiques affichées</li>
                <li>La compatibilité avec toutes les configurations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Protection des Données</h2>
              <p>
                Vos données sont stockées localement sur votre serveur.
                Consultez notre <a href="/privacy" className="text-blue-400 underline">Politique de Confidentialité</a> pour plus de détails.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Modifications du Service</h2>
              <p>
                Nous nous réservons le droit de modifier ou d'interrompre le service à tout moment,
                notamment en raison de changements dans les APIs Roblox.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Résiliation</h2>
              <p>
                Vous pouvez cesser d'utiliser l'application à tout moment en révoquant
                vos autorisations OAuth et en supprimant vos clés API.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Propriété Intellectuelle</h2>
              <p>
                Roblox est une marque déposée de Roblox Corporation.
                Cette application est un outil tiers non affilié à Roblox Corporation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Contact</h2>
              <p>
                Pour toute question concernant ces conditions, contactez l'administrateur
                de cette instance.
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
              className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              ← Retour au Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
