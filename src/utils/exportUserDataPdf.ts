import { jsPDF } from 'jspdf'
import type { ExportedUserData } from './exportUserData'

const MARGIN = 20
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const LINE_HEIGHT = 6
const SECTION_GAP = 10
const MAX_Y = PAGE_HEIGHT - 25

function safeStr(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(safeStr).join(', ')
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 200)
  return String(v)
}

function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}

/** Ajoute un titre de section, retourne la nouvelle position Y */
function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  if (y > MAX_Y - 15) {
    doc.addPage()
    y = MARGIN
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, MARGIN, y)
  return y + LINE_HEIGHT + 4
}

/** Ajoute du texte avec retour à la ligne et nouvelle page si besoin. Retourne la dernière position Y. */
function addWrappedText(
  doc: jsPDF,
  text: string,
  startY: number,
  opts: { maxWidth?: number; lineHeight?: number; fontSize?: number } = {}
): number {
  const maxWidth = opts.maxWidth ?? CONTENT_WIDTH
  const lineHeight = opts.lineHeight ?? LINE_HEIGHT
  const fontSize = opts.fontSize ?? 10
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(text, maxWidth)
  let y = startY
  for (const line of lines) {
    if (y > MAX_Y) {
      doc.addPage()
      y = MARGIN
    }
    doc.text(line, MARGIN, y)
    y += lineHeight
  }
  return y
}

/** Ajoute une ligne "Label : valeur" */
function addLine(doc: jsPDF, y: number, label: string, value: unknown): number {
  if (y > MAX_Y - LINE_HEIGHT) {
    doc.addPage()
    y = MARGIN
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(label + ' : ', MARGIN, y)
  const labelWidth = doc.getTextWidth(label + ' : ')
  doc.setFont('helvetica', 'normal')
  const valStr = truncate(safeStr(value), 80)
  const valLines = doc.splitTextToSize(valStr, CONTENT_WIDTH - labelWidth)
  doc.text(valLines[0], MARGIN + labelWidth, y)
  let ny = y + LINE_HEIGHT
  for (let i = 1; i < valLines.length; i++) {
    if (ny > MAX_Y) {
      doc.addPage()
      ny = MARGIN
    }
    doc.text(valLines[i], MARGIN, ny)
    ny += LINE_HEIGHT
  }
  return ny
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { dateStyle: 'medium' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export function buildPdfFromExportData(data: ExportedUserData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = MARGIN

  // Titre
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Export de vos données personnelles — Ollync', MARGIN, y)
  y += LINE_HEIGHT + 2
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  y = addWrappedText(doc, `Date d'export : ${formatDate(data.export_date_iso)}. Conformément au droit à la portabilité (RGPD, art. 20).`, y)
  y += SECTION_GAP

  // Profil
  if (data.profile && data.profile.length > 0) {
    const p = data.profile[0] as Record<string, unknown>
    y = addSectionTitle(doc, y, '1. Profil')
    const profileKeys: Array<[string, string]> = [
      ['Nom d\'utilisateur', 'username'],
      ['Nom affiché', 'full_name'],
      ['Email', 'email'],
      ['Téléphone', 'phone'],
      ['Bio', 'bio'],
      ['Ville', 'city'],
      ['Site web', 'website']
    ]
    for (const [label, key] of profileKeys) {
      const v = p[key]
      if (v != null && String(v).trim() !== '') y = addLine(doc, y, label, v)
    }
    if (Array.isArray(p.skills) && p.skills.length) {
      y = addLine(doc, y, 'Compétences', (p.skills as string[]).join(', '))
    }
    y += SECTION_GAP
  }

  // Annonces
  if (data.posts && data.posts.length > 0) {
    y = addSectionTitle(doc, y, `2. Annonces (${data.posts.length})`)
    for (let i = 0; i < data.posts.length; i++) {
      const post = (data.posts[i] as Record<string, unknown>)
      if (y > MAX_Y - 20) {
        doc.addPage()
        y = MARGIN
      }
      y = addLine(doc, y, 'Titre', post.title)
      y = addLine(doc, y, 'Description', truncate(safeStr(post.description), 300))
      y = addLine(doc, y, 'Date', formatDate(post.created_at as string))
      y = addLine(doc, y, 'Statut', post.status)
      y += 4
    }
    y += SECTION_GAP
  } else {
    y = addSectionTitle(doc, y, '2. Annonces')
    y = addWrappedText(doc, 'Aucune annonce.', y)
    y += SECTION_GAP
  }

  // Likes
  y = addSectionTitle(doc, y, `3. Likes (${data.likes?.length ?? 0})`)
  if (data.likes && data.likes.length > 0) {
    y = addWrappedText(doc, `Vous avez aimé ${data.likes.length} annonce(s). Liste des identifiants : ${(data.likes as Array<{ post_id?: string }>).map((l) => l.post_id).filter(Boolean).join(', ')}`, y)
  } else {
    y = addWrappedText(doc, 'Aucun like.', y)
  }
  y += SECTION_GAP

  // Notifications (résumé)
  const notifCount = data.notifications?.length ?? 0
  y = addSectionTitle(doc, y, `4. Notifications (${notifCount})`)
  if (data.notifications && data.notifications.length > 0) {
    const sample = (data.notifications as Array<Record<string, unknown>>).slice(0, 15)
    for (const n of sample) {
      if (y > MAX_Y - 15) {
        doc.addPage()
        y = MARGIN
      }
      y = addLine(doc, y, 'Type', n.type)
      y = addLine(doc, y, 'Titre', n.title)
      y = addLine(doc, y, 'Date', formatDate(n.created_at as string))
      y += 2
    }
    if (data.notifications.length > 15) {
      y = addWrappedText(doc, `… et ${data.notifications.length - 15} autre(s) notification(s).`, y)
    }
  } else {
    y = addWrappedText(doc, 'Aucune notification.', y)
  }
  y += SECTION_GAP

  // Demandes de match
  const mrCount = data.match_requests?.length ?? 0
  y = addSectionTitle(doc, y, `5. Demandes de match (${mrCount})`)
  if (data.match_requests && data.match_requests.length > 0) {
    for (const mr of data.match_requests as Array<Record<string, unknown>>) {
      if (y > MAX_Y - 20) {
        doc.addPage()
        y = MARGIN
      }
      y = addLine(doc, y, 'Statut', mr.status)
      y = addLine(doc, y, 'Message', truncate(safeStr(mr.request_message), 150))
      y = addLine(doc, y, 'Date', formatDate(mr.created_at as string))
      y += 4
    }
  } else {
    y = addWrappedText(doc, 'Aucune demande de match.', y)
  }
  y += SECTION_GAP

  // Candidatures
  const appCount = data.applications?.length ?? 0
  y = addSectionTitle(doc, y, `6. Candidatures (${appCount})`)
  if (data.applications && data.applications.length > 0) {
    for (const app of data.applications as Array<Record<string, unknown>>) {
      if (y > MAX_Y - 15) {
        doc.addPage()
        y = MARGIN
      }
      y = addLine(doc, y, 'Statut', app.status)
      y = addLine(doc, y, 'Date', formatDate(app.created_at as string))
      y += 4
    }
  } else {
    y = addWrappedText(doc, 'Aucune candidature.', y)
  }
  y += SECTION_GAP

  // Conversations
  const convCount = data.conversations?.length ?? 0
  y = addSectionTitle(doc, y, `7. Conversations (${convCount})`)
  if (data.conversations && data.conversations.length > 0) {
    y = addWrappedText(doc, `Vous participez à ${data.conversations.length} conversation(s). Dernier message : voir section Messages envoyés.`, y)
  } else {
    y = addWrappedText(doc, 'Aucune conversation.', y)
  }
  y += SECTION_GAP

  // Messages envoyés
  const msgCount = data.messages_sent?.length ?? 0
  y = addSectionTitle(doc, y, `8. Messages envoyés (${msgCount})`)
  if (data.messages_sent && data.messages_sent.length > 0) {
    const sample = (data.messages_sent as Array<Record<string, unknown>>).slice(0, 25)
    for (const m of sample) {
      if (y > MAX_Y - 15) {
        doc.addPage()
        y = MARGIN
      }
      y = addLine(doc, y, 'Contenu', truncate(safeStr(m.content), 120))
      y = addLine(doc, y, 'Date', formatDate(m.created_at as string))
      y += 2
    }
    if (data.messages_sent.length > 25) {
      y = addWrappedText(doc, `… et ${data.messages_sent.length - 25} autre(s) message(s).`, y)
    }
  } else {
    y = addWrappedText(doc, 'Aucun message envoyé.', y)
  }
  y += SECTION_GAP

  // Abonnements
  const followFollowing = data.follows_following?.length ?? 0
  const followFollowers = data.follows_followers?.length ?? 0
  y = addSectionTitle(doc, y, '9. Abonnements')
  y = addWrappedText(doc, `Profils que vous suivez : ${followFollowing}. Abonnés à votre profil : ${followFollowers}.`, y)
  y += SECTION_GAP

  // Pied de page
  if (y > MAX_Y - 15) {
    doc.addPage()
    y = MARGIN
  }
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  y = addWrappedText(doc, 'Cet export contient les données personnelles que nous détenons sur vous. Pour les données brutes (JSON), utilisez l’option « Télécharger en JSON » dans Paramètres > Gestion de mes données.', y, { fontSize: 9 })

  return doc
}

/**
 * Génère un PDF lisible et déclenche son téléchargement.
 */
export function downloadExportedDataAsPdf(data: ExportedUserData, filename?: string): void {
  const doc = buildPdfFromExportData(data)
  const name = filename || `ollync-donnees-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(name)
}
