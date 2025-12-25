import { Lock } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const MentionsLegales = () => {
  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">Mentions légales</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </div>

          <h4>Éditeur</h4>
          <p>
            <strong>Ollync</strong><br />
            Forme juridique : [À compléter]<br />
            Capital social : [À compléter]<br />
            Siège social : [À compléter]<br />
            SIRET : [À compléter]<br />
            Email : contact@ollync.com<br />
            Téléphone : +33 1 XX XX XX XX<br />
            Directeur de publication : [À compléter]
          </p>

          <h4>Hébergement</h4>
          <p>
            Ce site est hébergé par Supabase<br />
            Adresse : [À compléter]<br />
            Pour plus d'informations : https://supabase.com
          </p>

          <h4>Propriété intellectuelle</h4>
          <p>
            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur 
            et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les 
            documents téléchargeables et les représentations iconographiques et photographiques.
          </p>
          <p>
            La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement 
            interdite sauf autorisation expresse de l'éditeur.
          </p>

          <h4>Responsabilité</h4>
          <p>
            Les informations contenues sur ce site sont aussi précises que possible et le site est mis à jour 
            à différentes périodes de l'année, mais peut toutefois contenir des inexactitudes, des omissions ou 
            des lacunes.
          </p>
          <p>
            Ollync ne pourra être tenu responsable de tout dommage direct ou indirect causé au matériel de 
            l'utilisateur, lors de l'accès au site, et résultant soit de l'utilisation d'un matériel ne répondant 
            pas aux spécifications, soit de l'apparition d'un bug ou d'une incompatibilité.
          </p>

          <h4>CNIL</h4>
          <p>
            Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement Général 
            sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de modification et de suppression 
            des données qui vous concernent.
          </p>
          <p>
            Vous pouvez exercer ce droit en nous contactant à l'adresse : contact@ollync.com
          </p>

          <h4>Loi applicable</h4>
          <p>
            Le présent site est régi par la loi française. En cas de litige et à défaut d'accord amiable, 
            le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MentionsLegales

