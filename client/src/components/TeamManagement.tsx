import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getTeamMembers, addTeamMember, removeTeamMember, updateMemberRole } from '../api/auth'

interface TeamMember {
  id: number
  userId: number
  username: string
  email: string
  role: string
  joinedAt: string
}

export default function TeamManagement() {
  const { currentTeam, user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Formulaire d'invitation
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (currentTeam) {
      loadMembers()
    }
  }, [currentTeam])

  const loadMembers = async () => {
    if (!currentTeam) return

    try {
      setLoading(true)
      setError('')
      const data = await getTeamMembers(currentTeam.id)
      setMembers(data.members || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des membres')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeam) return

    try {
      setInviting(true)
      setError('')
      setSuccess('')

      await addTeamMember(currentTeam.id, inviteEmail, inviteRole)

      setSuccess(`Invitation envoyée à ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('member')

      // Recharger la liste
      await loadMembers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!currentTeam) return
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${username} de l'équipe ?`)) return

    try {
      setError('')
      setSuccess('')
      await removeTeamMember(currentTeam.id, userId)
      setSuccess(`${username} a été retiré de l'équipe`)
      await loadMembers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleChangeRole = async (userId: number, username: string, currentRole: string) => {
    if (!currentTeam) return

    const newRole = prompt(
      `Changer le rôle de ${username}:\n\nRôles disponibles:\n- owner (Propriétaire)\n- admin (Administrateur)\n- member (Membre)\n- viewer (Observateur)\n\nRôle actuel: ${currentRole}\nNouveau rôle:`,
      currentRole
    )

    if (!newRole || newRole === currentRole) return

    if (!['owner', 'admin', 'member', 'viewer'].includes(newRole)) {
      setError('Rôle invalide')
      return
    }

    try {
      setError('')
      setSuccess('')
      await updateMemberRole(currentTeam.id, userId, newRole)
      setSuccess(`Rôle de ${username} changé vers ${newRole}`)
      await loadMembers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du changement de rôle')
    }
  }

  if (!currentTeam) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Aucune équipe sélectionnée</p>
        </div>
      </div>
    )
  }

  const userRole = currentTeam.role
  const canManage = ['owner', 'admin'].includes(userRole)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gestion de l'équipe: {currentTeam.name}</h1>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Formulaire d'invitation (seulement owner/admin) */}
      {canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Inviter un membre</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="email@example.com"
                disabled={inviting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rôle</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={inviting}
              >
                <option value="viewer">Observateur (lecture seule)</option>
                <option value="member">Membre (lecture + modification)</option>
                <option value="admin">Administrateur (toutes permissions)</option>
                {userRole === 'owner' && <option value="owner">Propriétaire</option>}
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {inviting ? 'Envoi en cours...' : 'Inviter'}
            </button>
          </form>
        </div>
      )}

      {/* Liste des membres */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Membres de l'équipe ({members.length})</h2>

          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-500">Aucun membre</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.username}</span>
                      {member.userId === user?.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Vous
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400">
                      Rôle: <span className="font-medium">{member.role}</span> •
                      Rejoint le {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {canManage && member.userId !== user?.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChangeRole(member.userId, member.username, member.role)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Changer le rôle
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.username)}
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informations sur les rôles */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold mb-2">Rôles et permissions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Propriétaire:</strong> Toutes les permissions, peut transférer la propriété</li>
          <li><strong>Administrateur:</strong> Peut modifier la configuration, gérer les membres</li>
          <li><strong>Membre:</strong> Peut modifier la configuration, accès lecture/écriture</li>
          <li><strong>Observateur:</strong> Accès lecture seule, ne peut pas modifier</li>
        </ul>
      </div>
    </div>
  )
}
