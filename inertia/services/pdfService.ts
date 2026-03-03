
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Employee, ExerciseType } from "../types";

/**
 * Service de génération de PDF "Expert" pour France Transition Carrière.
 * Inclut désormais la page de Systémie du Rebond.
 */
export async function generateComprehensivePDF(employee: Employee) {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const renderRoot = document.createElement('div');
  renderRoot.style.position = 'fixed';
  renderRoot.style.left = '-3000px';
  renderRoot.style.top = '0';
  renderRoot.style.width = '210mm';
  renderRoot.style.backgroundColor = '#ffffff';
  renderRoot.className = 'font-sans text-slate-900';
  document.body.appendChild(renderRoot);

  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .pdf-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; background: white; position: relative; overflow: hidden; display: flex; flex-direction: column; }
    .pdf-header { border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 4mm; margin-bottom: 8mm; display: flex; justify-content: space-between; align-items: flex-end; }
    .pdf-footer { position: absolute; bottom: 8mm; left: 20mm; right: 20mm; border-top: 0.5pt solid #e2e8f0; padding-top: 3mm; display: flex; justify-content: space-between; font-size: 7pt; color: #94a3b8; font-weight: 800; text-transform: uppercase; }
    .section-title { font-size: 22pt; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; margin-bottom: 6mm; text-transform: uppercase; border-left: 5pt solid #8B5CF6; padding-left: 5mm; }
    .card { background: #f8fafc; border: 0.5pt solid #e2e8f0; border-radius: 6mm; padding: 6mm; margin-bottom: 5mm; }
    .tag { display: inline-block; padding: 1mm 3mm; border-radius: 3mm; font-size: 6.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
    .tag-violet { background: #f5f3ff; color: #7c3aed; }
    .tag-orange { background: #fff7ed; color: #ea580c; }
    .tag-lime { background: #f7fee7; color: #65a30d; }
    
    /* Styles pour la Systémie */
    .systemic-container { position: relative; width: 100%; height: 160mm; margin-top: 10mm; display: flex; items-center; justify-content: center; }
    .systemic-center-line { position: absolute; width: 120mm; height: 120mm; border: 2pt dashed #e2e8f0; border-radius: 50%; z-index: 0; }
    .systemic-node { position: absolute; width: 42mm; height: 42mm; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4mm; box-sizing: border-box; z-index: 10; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 2pt solid white; }
    .node-title { font-size: 7pt; font-weight: 900; text-transform: uppercase; margin-bottom: 1.5mm; }
    .node-content { font-size: 6.5pt; font-weight: 600; line-height: 1.3; }
  `;
  renderRoot.appendChild(styleTag);

  const captureAndAddPage = async (element: HTMLElement) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: element.offsetWidth,
      windowHeight: element.offsetHeight,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (pdf.internal.pages.length > 1) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  };

  // Préparation des données pour la systémie
  const motivationResult = employee.exercises.find(e => e.type === ExerciseType.MOTIVATION);
  const valuesResult = employee.exercises.find(e => e.type === ExerciseType.VALUES);
  const discResult = employee.exercises.find(e => e.type === ExerciseType.DISC);
  
  const topMotivations = motivationResult?.data.ranked.slice(0, 3).join(', ') || "Non défini";
  const topValues = valuesResult?.data.selectedValues.slice(0, 3).join(', ') || "Non défini";
  const skillsList = employee.skills.filter(s => s.level >= 4).map(s => s.name).slice(0, 4).join(', ') || "En cours";
  
  let personalitySummary = "Analyse en cours";
  if (discResult) {
    const d = discResult.data;
    const sorted = Object.entries(d).sort(([,a], [,b]) => (b as number) - (a as number));
    personalitySummary = `Profil dominant : ${sorted[0][0]}${sorted[1][0]}`;
  }

  try {
    // --- PAGE 1 : COUVERTURE ---
    const coverPage = document.createElement('div');
    coverPage.className = 'pdf-page';
    coverPage.style.backgroundColor = '#1e1b4b';
    coverPage.style.color = 'white';
    coverPage.style.justifyContent = 'center';
    coverPage.innerHTML = `
      <div style="padding: 20mm; text-align: center;">
        <div class="tag" style="background: #8B5CF6; color: white; margin-bottom: 10mm; padding: 2mm 5mm; border-radius: 5mm;">Rapport Individuel Expert</div>
        <h1 style="font-size: 42pt; font-weight: 900; line-height: 1; letter-spacing: -0.05em; margin-bottom: 12mm;">TRANSITION<br/><span style="color: #F97316;">VITAMINÉE</span></h1>
        <div style="width: 20mm; height: 2mm; background: #8B5CF6; margin: 0 auto 20mm;"></div>
        <div style="font-size: 24pt; font-weight: 900; color: #ffffff;">${employee.name}</div>
        <div style="font-size: 11pt; font-weight: 600; color: #94a3b8; margin-top: 4mm; text-transform: uppercase; letter-spacing: 0.2em;">Dossier de Rebond Systémique</div>
      </div>
      <div class="pdf-footer" style="border-color: rgba(255,255,255,0.1); color: #64748b;">
        <span>FRANCE TRANSITION CARRIÈRE</span>
        <span>${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</span>
      </div>
    `;
    renderRoot.appendChild(coverPage);
    await captureAndAddPage(coverPage);

    // --- PAGE 2 : SYSTÉMIE DU REBOND (LA NOUVELLE PAGE) ---
    const systemicPage = document.createElement('div');
    systemicPage.className = 'pdf-page';
    systemicPage.innerHTML = `
      <div class="pdf-header">
        <div style="font-size: 9pt; font-weight: 900; color: #8B5CF6;">ANALYSE SYSTÉMIQUE</div>
        <div style="font-size: 9pt; font-weight: 900; color: #94a3b8;">PAGE 02</div>
      </div>
      <h2 class="section-title">Systémie du Rebond</h2>
      <p style="font-size: 10pt; color: #64748b; margin-bottom: 5mm; font-weight: 500;">
        Ce schéma illustre l'interdépendance des facteurs clés de votre projet. Le rebond professionnel est l'émergence équilibrée de ces 7 dimensions.
      </p>

      <div class="systemic-container">
        <div class="systemic-center-line"></div>
        
        <!-- 1. Traits de Personnalité (TOP) -->
        <div class="systemic-node" style="top: 0; left: 50%; transform: translateX(-50%); background: #f5f3ff; color: #7c3aed;">
          <div class="node-title">Traits de Personnalité</div>
          <div class="node-content">${personalitySummary}</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Points d'appui & vigilance</div>
        </div>

        <!-- 2. Besoins (TOP RIGHT) -->
        <div class="systemic-node" style="top: 20mm; right: 10mm; background: #fff7ed; color: #ea580c;">
          <div class="node-title">Besoins</div>
          <div class="node-content">Autonomie, Structure, Reconnaissance</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Externes & Internes</div>
        </div>

        <!-- 3. Compétences (BOTTOM RIGHT) -->
        <div class="systemic-node" style="bottom: 20mm; right: 10mm; background: #ecfdf5; color: #059669;">
          <div class="node-title">Compétences</div>
          <div class="node-content">${skillsList}</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Zones de talent</div>
        </div>

        <!-- 4. Contraintes (BOTTOM) -->
        <div class="systemic-node" style="bottom: 0; left: 50%; transform: translateX(-50%); background: #fefce8; color: #a16207;">
          <div class="node-title">Contraintes</div>
          <div class="node-content">Mobilité IDF, Temps partiel souhaité</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Engagements & Limites</div>
        </div>

        <!-- 5. Valeurs (BOTTOM LEFT) -->
        <div class="systemic-node" style="bottom: 20mm; left: 10mm; background: #fdf2f8; color: #db2777;">
          <div class="node-title">Valeurs</div>
          <div class="node-content">${topValues}</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Guident le comportement</div>
        </div>

        <!-- 6. Contexte Favorable (MID LEFT) -->
        <div class="systemic-node" style="top: 50%; left: 0; transform: translateY(-50%); background: #f0f9ff; color: #0284c7;">
          <div class="node-title">Contexte</div>
          <div class="node-content">Environnement agile, Management participatif</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Facteurs d'émergence</div>
        </div>

        <!-- 7. Motivations (TOP LEFT) -->
        <div class="systemic-node" style="top: 20mm; left: 10mm; background: #f5f3ff; color: #7c3aed;">
          <div class="node-title">Motivations</div>
          <div class="node-content">${topMotivations}</div>
          <div style="font-size: 5pt; margin-top: 2mm; opacity: 0.7;">Le fil conducteur / Plaisir</div>
        </div>
      </div>

      <div class="pdf-footer"><span>FRANCE TRANSITION CARRIÈRE</span><span>APPROCHE SYSTÉMIQUE</span></div>
    `;
    renderRoot.appendChild(systemicPage);
    await captureAndAddPage(systemicPage);

    // --- PAGE 3 : SYNTHÈSE GLOBALE ---
    const summaryPage = document.createElement('div');
    summaryPage.className = 'pdf-page';
    summaryPage.innerHTML = `
      <div class="pdf-header">
        <div style="font-size: 9pt; font-weight: 900; color: #8B5CF6;">SYNTHÈSE EXPERT</div>
        <div style="font-size: 9pt; font-weight: 900; color: #94a3b8;">PAGE 03</div>
      </div>
      <h2 class="section-title">Analyse de l'Accompagnateur</h2>
      <div class="card" style="margin-bottom: 10mm;">
        <span class="data-label">Observations et Recommandations</span>
        <div style="font-size: 10.5pt; color: #334155; line-height: 1.6; font-style: italic; white-space: pre-wrap;">"${employee.advisorNotes || "Aucune note saisie."}"</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;">
        <div class="card">
          <span class="data-label">Maîtrise Compétences</span>
          <div style="margin-top: 4mm;">
            ${employee.skills.map(s => `
              <div style="margin-bottom: 4mm;">
                <div style="display: flex; justify-content: space-between; font-size: 8pt; font-weight: 800; color: #1e293b; margin-bottom: 1mm;">
                  <span>${s.name}</span>
                  <span>${s.level}/5</span>
                </div>
                <div style="height: 1.5mm; background: #f1f5f9; border-radius: 1mm; overflow: hidden;">
                  <div style="height: 100%; background: #8B5CF6; width: ${(s.level/5)*100}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <span class="data-label">Projet Professionnel</span>
          <div style="margin-top: 4mm;">
            <div style="margin-bottom: 6mm;">
              <div class="data-label" style="color: #F97316;">Cible Identifiée</div>
              <div class="data-value" style="font-size: 14pt;">${employee.targetRole || "Non définie"}</div>
            </div>
            <div class="tag tag-violet">${employee.status}</div>
          </div>
        </div>
      </div>
      <div class="pdf-footer"><span>FRANCE TRANSITION CARRIÈRE</span><span>CONFIDENTIEL</span></div>
    `;
    renderRoot.appendChild(summaryPage);
    await captureAndAddPage(summaryPage);

    // --- PAGES D'EXERCICES ---
    for (const [index, result] of employee.exercises.entries()) {
      const exercisePage = document.createElement('div');
      exercisePage.className = 'pdf-page';
      
      let detailContent = '';
      if (result.type === ExerciseType.MOTIVATION) {
        detailContent = `
          <h2 class="section-title">Analyse Motivations</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;">
            <div>
              <span class="data-label">Top 11 Facteurs</span>
              ${result.data.ranked.slice(0, 11).map((m: string, i: number) => `<div class="list-item"><div class="list-number" style="background: #8B5CF6; color: white;">${i+1}</div><div class="data-value" style="font-size: 8pt;">${m}</div></div>`).join('')}
            </div>
            <div>
              <span class="data-label">Suivant</span>
              ${result.data.ranked.slice(11, 22).map((m: string, i: number) => `<div class="list-item"><div class="list-number">${i+12}</div><div class="data-value" style="font-size: 8pt;">${m}</div></div>`).join('')}
            </div>
          </div>
        `;
      } else if (result.type === ExerciseType.VALUES) {
        detailContent = `
          <h2 class="section-title">Analyse Valeurs</h2>
          <div style="display: flex; flex-direction: column; gap: 2mm;">
            ${result.data.selectedValues.map((v: string, i: number) => `
              <div style="display: flex; align-items: center; gap: 4mm;">
                <div style="width: 8mm; font-size: 7pt; font-weight: 900; color: #94a3b8;">${i+1}</div>
                <div style="flex-grow: 1; height: 6mm; background: #f8fafc; border: 0.5pt solid #e2e8f0; border-radius: 2mm; overflow: hidden; position: relative;">
                  <div style="position: absolute; left: 0; top: 0; bottom: 0; background: #8B5CF6; opacity: 0.1; width: ${100-(i*9)}%;"></div>
                  <span style="position: relative; font-size: 8.5pt; font-weight: 800; padding-left: 4mm; line-height: 6mm;">${v}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (result.type === ExerciseType.DISC) {
        detailContent = `
          <h2 class="section-title">Analyse DISC</h2>
          <div class="card">
             ${Object.entries(result.data).map(([key, val]) => `
               <div style="margin-bottom: 4mm;">
                 <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                   <span style="font-size: 9pt; font-weight: 900;">${key === 'D' ? 'Dominance' : key === 'I' ? 'Influence' : key === 'S' ? 'Stabilité' : 'Conformité'}</span>
                   <span style="font-size: 9pt; font-weight: 900; color: #8B5CF6;">${val}%</span>
                 </div>
                 <div style="height: 2mm; background: #f1f5f9; border-radius: 1mm; overflow: hidden;"><div style="height: 100%; background: #8B5CF6; width: ${val}%"></div></div>
               </div>
             `).join('')}
          </div>
        `;
      }

      exercisePage.innerHTML = `
        <div class="pdf-header">
          <div style="font-size: 9pt; font-weight: 900; color: #8B5CF6;">DIAGNOSTIC DÉTAILLÉ</div>
          <div style="font-size: 9pt; font-weight: 900; color: #94a3b8;">${result.date}</div>
        </div>
        <div style="flex-grow: 1;">
          ${detailContent}
          <div class="card" style="margin-top: 10mm; background: #f5f3ff; border-color: #ddd6fe;">
            <span class="data-label" style="color: #7c3aed;">Analyse Qualitative Gemini</span>
            <div style="font-size: 9.5pt; color: #4c1d95; line-height: 1.6; font-style: italic;">"${result.qualitativeAnalysis}"</div>
          </div>
        </div>
        <div class="pdf-footer"><span>PAGE ${String(index + 4).padStart(2, '0')}</span><span>DÉTAIL EXERCICE</span></div>
      `;
      renderRoot.appendChild(exercisePage);
      await captureAndAddPage(exercisePage);
    }

    const finalFileName = `Rapport_Transition_${employee.name.replace(/\s+/g, '_')}.pdf`;
    pdf.save(finalFileName);

  } catch (err) {
    console.error("PDF Export failed:", err);
    alert("Erreur export PDF.");
  } finally {
    document.body.removeChild(renderRoot);
  }
}
