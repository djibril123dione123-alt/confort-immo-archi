// src/lib/pdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * ------------------------------
 * FONCTIONS UTILITAIRES
 * ------------------------------
 */

/**
 * Format monétaire pour XOF avec séparateur correct
 */
export function formatCurrencyXOF(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u00A0/g, ' ');
}

/**
 * Ajoute un footer avec numéro de page
 */
export function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

/**
 * Génère une référence unique pour la facture
 */
export function generateFactureRef(p: any) {
  const d = new Date(p.created_at || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const suffix = (p.id || '').toString().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `FAC-${y}${m}-${suffix || 'XXXXXX'}`;
}

/**
 * Charger un template texte depuis un chemin
 */
export async function fetchTemplate(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Template introuvable: ' + path);
  return await res.text();
}

/**
 * Remplacer les variables dans le template sans laisser de ** visibles
 */
export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
    const val = vars[key.trim()] ?? '';
    return val;
  });
}

/**
 * Affiche du texte en gérant le gras si nécessaire
 */
function drawTextWithBold(doc: jsPDF, text: string, x: number, y: number) {
  const parts = text.split('**'); // on peut conserver pour futur, ici aucun ** ne sera présent
  let cursorX = x;
  let bold = false;

  parts.forEach(part => {
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.text(part, cursorX, y);
    cursorX += doc.getTextWidth(part);
    bold = !bold;
  });
}

/**
 * ------------------------------
 * CONTRAT LOCATION
 * ------------------------------
 */
export async function generateContratPDF(contrat: any) {
  if (!contrat) throw new Error('Aucun contrat fourni');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  const bailleur = contrat?.unites?.immeubles?.bailleurs || {};
  const locataire = contrat?.locataires || {};

  try {
    const tpl = await fetchTemplate('/templates/contrat_location.txt');

    // Calcul de la durée en années
    let dureeAnnees = '1';
    if (contrat.date_debut && contrat.date_fin) {
      try {
        const d1 = new Date(contrat.date_debut);
        const d2 = new Date(contrat.date_fin);
        const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
        if (months > 0) dureeAnnees = (months / 12).toFixed(months % 12 === 0 ? 0 : 1);
      } catch {}
    }

    // Remplacement des variables dans le template et récupération des valeurs dynamiques pour le gras
    const dynamicVars: Record<string, string> = {
      bailleur_prenom: bailleur.prenom || '',
      bailleur_nom: bailleur.nom || '',
      locataire_prenom: locataire.prenom || '',
      locataire_nom: locataire.nom || '',
      locataire_cni: locataire.piece_identite || '',
      locataire_adresse: locataire.adresse_personnelle || '',
      designation: `${contrat?.unites?.nom || ''} - ${contrat?.unites?.immeubles?.nom || ''}`,
      destination_local: 'Habitation',
      duree_annees: dureeAnnees,
      date_debut: contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : '…',
      date_fin: contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : '…',
      loyer_mensuel: formatCurrencyXOF(Number(contrat.loyer_mensuel || 0)),
      depot_garantie: contrat.caution ? formatCurrencyXOF(Number(contrat.caution)) : '',
      date_du_jour: new Date().toLocaleDateString('fr-FR'),
    };

    let body = tpl;
    const dynamicValues: string[] = [];

    // Remplacer les {{key}} par la valeur réelle et enregistrer les valeurs dynamiques
    body = body.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
      const value = dynamicVars[key.trim()] ?? '';
      if (value) dynamicValues.push(value);
      return value;
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 14;
    const usableWidth = pageWidth - 28;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 25;

    // TITRE sur la première page uniquement
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('CONTRAT DE LOCATION', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');

    const lines = doc.splitTextToSize(body, usableWidth);
    let isFirstPage = true;

    for (const line of lines) {
      // Passage à la page suivante si besoin
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 25;

        // **Ne pas répéter le titre sur les pages suivantes**
        isFirstPage = false;
      }

      // Dessiner le texte avec les valeurs dynamiques en gras
      let x = leftMargin;
      let remainingLine = line;

      while (remainingLine) {
        let found = false;
        for (const val of dynamicValues) {
          const index = remainingLine.indexOf(val);
          if (index !== -1) {
            const before = remainingLine.substring(0, index);
            if (before) {
              doc.setFont(undefined, 'normal');
              doc.text(before, x, y);
              x += doc.getTextWidth(before);
            }
            doc.setFont(undefined, 'bold');
            doc.text(val, x, y);
            x += doc.getTextWidth(val);
            remainingLine = remainingLine.substring(index + val.length);
            found = true;
            break;
          }
        }
        if (!found) {
          doc.setFont(undefined, 'normal');
          doc.text(remainingLine, x, y);
          remainingLine = '';
        }
      }

      y += lineHeight;
    }
  } catch (err) {
    console.error('Erreur génération contrat:', err);
  }

  // Ajouter le footer avec numéro de page
  addFooter(doc);

  // Sauvegarder le PDF
  doc.save(`contrat-${locataire?.nom || 'locataire'}-${Date.now()}.pdf`);
}


/**
 * ------------------------------
 * FACTURE DE PAIEMENT
 * ------------------------------
 */
export async function generatePaiementFacturePDF(paiement: any) {
  if (!paiement) throw new Error('Aucun paiement fourni');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const contrat = paiement?.contrats || {};
  const locataire = contrat?.locataires || {};
  const unite = contrat?.unites || {};

  const loyer = Number(contrat?.loyer_mensuel || 0);
  const paye = Number(paiement?.montant_total || 0);
  const reliquat = Math.max(loyer - paye, 0);
  const ref = paiement.reference || generateFactureRef(paiement);

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 14;
  const rightMargin = 14;
  const usableWidth = pageWidth - leftMargin - rightMargin;
  const title = 'Quittance Loyer';
  const titleFontSize = 16;
  const bodyFontSize = 11;

  // Titre
  doc.setFont(undefined, 'bold');
  doc.setFontSize(titleFontSize);
  doc.text(title, pageWidth / 2, 15, { align: 'center' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(bodyFontSize);
  let y = 25;

  // Référence
  doc.setFont(undefined, 'bold');
  doc.text(`Référence : ${ref}`, leftMargin, y);
  y += 6;

  // Date
  const datePaiement = paiement.date_paiement
    ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  doc.text(`Date : ${datePaiement}`, leftMargin, y);
  y += 8;

  // Informations du locataire
  doc.setFont(undefined, 'bold');
  doc.text('Informations du locataire', leftMargin, y);
  y += 6;
  doc.setFont(undefined, 'bold');
  doc.text(
    `Nom : ${locataire ? `${locataire.prenom || ''} ${locataire.nom || ''}` : '—'}`,
    leftMargin,
    y
  );
  y += 6;

  doc.text(`Adresse du logement : ${unite?.immeubles?.adresse || '—'}`, leftMargin, y);
  y += 6;

  const moisConcerne = paiement.mois_concerne
    ? new Date(paiement.mois_concerne).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
    : '—';
  doc.text(`Mois concerné : ${moisConcerne}`, leftMargin, y);
  y += 10;

  // Tableau autoTable
  autoTable(doc, {
    startY: y,
    head: [['Libellé', 'Montant']],
    body: [
      ['Montant du loyer', formatCurrencyXOF(loyer)],
      ['Montant payé', formatCurrencyXOF(paye)],
      ['Reliquat (reste à payer)', formatCurrencyXOF(reliquat)],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold' },
    margin: { left: leftMargin, right: rightMargin },
    tableWidth: usableWidth,
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;

  const mentions = [
    "NB 1 : Le locataire ne peut déménager sans avoir payé l’intégralité du loyer dû et effectué toutes les réparations à sa charge.",
    'NB 2 : La sous-location est strictement interdite.',
  ];

  doc.setFont(undefined, 'bold');
  doc.text('Mentions', leftMargin, finalY);

  doc.setFont(undefined, 'normal');
  let yMentions = finalY + 6;
  mentions.forEach((m) => {
    const lines = doc.splitTextToSize(`- ${m}`, usableWidth);
    doc.text(lines, leftMargin, yMentions);
    yMentions += lines.length * 5;
  });

  addFooter(doc);
  doc.save(`facture-${locataire?.nom || 'locataire'}-${Date.now()}.pdf`);
}

/**
 * ------------------------------
 * MANDAT DE GÉRANCE BAILLEUR
 * ------------------------------
 * Génère un mandat de gérance avec les valeurs dynamiques en gras
 * Le titre n'apparaît que sur la première page
 */
export async function generateMandatBailleurPDF(bailleur: any) {
  if (!bailleur) throw new Error('Aucun bailleur fourni');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  try {
    const tpl = await fetchTemplate('/templates/mandat_gerance.txt');

    // Champs dynamiques
    const vars: Record<string, string> = {
      bailleur_prenom: bailleur.prenom || '',
      bailleur_nom: bailleur.nom || '',
      bailleur_cni: bailleur.piece_identite || '',
      bailleur_adresse: bailleur.adresse || '',
      bien_adresse: bailleur.bien_adresse || '',
      bien_composition: bailleur.bien_composition || '',
      taux_honoraires: bailleur.taux_honoraires ? String(bailleur.taux_honoraires) : '10',
      date_debut: bailleur.date_debut
        ? new Date(bailleur.date_debut).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR'),
      duree_annees: bailleur.duree_annees ? String(bailleur.duree_annees) : '1',
      date_du_jour: new Date().toLocaleDateString('fr-FR'),
    };

    let body = tpl;
    const dynamicValues: string[] = [];

    // Remplacer les {{key}} par la valeur réelle et garder la liste pour gras
    body = body.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
      const value = vars[key.trim()] ?? '';
      if (value) dynamicValues.push(value);
      return value;
    });

    if (!body.trim()) body = 'Contenu du mandat vide.';

    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 14;
    const usableWidth = pageWidth - leftMargin - 14;
    const title = 'MANDAT DE GÉRANCE';
    const titleFontSize = 16;
    const bodyFontSize = 11;
    const lineHeight = 7;

    // TITRE UNIQUEMENT SUR LA PREMIÈRE PAGE
    doc.setFont(undefined, 'bold');
    doc.setFontSize(titleFontSize);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(bodyFontSize);

    const lines = doc.splitTextToSize(body, usableWidth);
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20;
    let y = 25;

    for (const line of lines) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = 25; // nouvelle page, mais **pas de titre**
      }

      // Vérifier si la ligne contient une valeur dynamique et mettre en gras
      let x = leftMargin;
      let remainingLine = line;
      while (remainingLine) {
        let found = false;
        for (const val of dynamicValues) {
          const index = remainingLine.indexOf(val);
          if (index !== -1) {
            const before = remainingLine.substring(0, index);
            if (before) {
              doc.setFont(undefined, 'normal');
              doc.text(before, x, y);
              x += doc.getTextWidth(before);
            }
            doc.setFont(undefined, 'bold');
            doc.text(val, x, y);
            x += doc.getTextWidth(val);
            remainingLine = remainingLine.substring(index + val.length);
            found = true;
            break;
          }
        }
        if (!found) {
          doc.setFont(undefined, 'normal');
          doc.text(remainingLine, x, y);
          remainingLine = '';
        }
      }

      y += lineHeight;
    }
  } catch {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    const text = `Mandat de gérance\nPropriétaire: ${bailleur.prenom || ''} ${bailleur.nom || ''}`;
    doc.text(doc.splitTextToSize(text, 182), 14, 50);
  }

  addFooter(doc);
  doc.save(`mandat-${bailleur.nom || 'bailleur'}-${Date.now()}.pdf`);
}
