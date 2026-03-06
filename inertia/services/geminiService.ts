import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

export async function suggestSkillMapping(jobTitle: string) {
  const model = 'gemini-3-flash-preview'
  const prompt = `En tant qu'expert en bilan de compétences et VAE, suggère une structure de compétences pour le poste de "${jobTitle}".
  Propose 3 missions principales. Pour chaque mission, liste 2 activités concrètes typiques de ce métier.
  Reste très professionnel et précis.
  Réponds exclusivement en JSON avec cette structure précise: 
  [
    { "mission": "Titre de la mission 1", "activities": ["Activité 1.1", "Activité 1.2"] },
    ...
  ]`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    })
    return JSON.parse(response.text)
  } catch (error) {
    console.error('Gemini Suggestion error:', error)
    return []
  }
}

export async function extractSkillMappingFromText(text: string) {
  const model = 'gemini-3-flash-preview'
  const prompt = `Analyse le récit d'expérience suivant : "${text}".
  Extrais les missions principales et les activités liées mentionnées. 
  Si tu identifies des résultats chiffrés ou des outils spécifiques, place-les dans la colonne 'proof'.
  Réponds exclusivement en JSON avec cette structure: 
  { "mapping": [ { "mission": "string", "activity": "string", "proof": "string" } ] }`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    })
    return JSON.parse(response.text)
  } catch (error) {
    console.error('Gemini Narrative error:', error)
    return { mapping: [] }
  }
}

export async function challengeProof(activity: string, proof: string) {
  const model = 'gemini-3-flash-preview'
  const prompt = `Un candidat décrit son activité : "${activity}". Sa preuve actuelle est : "${proof}".
  Pose une SEULE question très courte (max 15 mots) et stimulante pour l'aider à quantifier ou illustrer son succès (ex: volume, budget, impact, outil). 
  La question doit être directe et inciter à donner un chiffre ou un fait précis.`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
    })
    return response.text
  } catch (error) {
    return "Pouvez-vous préciser l'impact ou l'outil utilisé ?"
  }
}

export async function analyzeExerciseResult(type: string, data: any): Promise<string> {
  const model = 'gemini-3-flash-preview'
  let prompt = `Analyse professionnelle pour un accompagnement carrière : ${type}. Données : ${JSON.stringify(data)}.
  Produis une analyse courte (max 4 phrases), encourageante, vitaminée, avec un conseil concret basé sur les données reçues. 
  Sois expert et bienveillant.`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.8 },
    })
    return response.text || 'Analyse indisponible.'
  } catch (error) {
    return "Erreur lors de la génération de l'analyse."
  }
}

export async function extractCVData(base64File: string, mimeType: string) {
  const model = 'gemini-3-flash-preview'
  const prompt = `Analyse ce CV et extrais les informations suivantes de manière structurée. 
  Réponds exclusivement en JSON.`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64File.split(',')[1], mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            currentRole: { type: Type.STRING },
            suggestedTargetRole: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  level: { type: Type.NUMBER },
                },
              },
            },
            experiences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    description: 'CDI, CDD, Alternance, Freelance, Stage',
                  },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  isCurrent: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
              },
            },
            educations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  school: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  isCurrent: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    })

    const text = response.text
    if (text) {
      const data = JSON.parse(text)
      data.experiences = (data.experiences || []).map((exp: any) => ({
        ...exp,
        id: exp.id || Math.random().toString(36).substr(2, 9),
        isCurrent: !!exp.isCurrent,
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        type: exp.type || 'CDI',
      }))
      data.educations = (data.educations || []).map((edu: any) => ({
        ...edu,
        id: edu.id || Math.random().toString(36).substr(2, 9),
        isCurrent: !!edu.isCurrent,
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
      }))
      data.skills = (data.skills || []).map((s: any) => ({
        name: s.name,
        level: Math.min(5, Math.max(1, s.level || 3)),
      }))
      return data
    }
    return null
  } catch (error) {
    console.error('Gemini CV Extraction error:', error)
    return null
  }
}

export async function suggestTargets(profile: { skills: string[]; targetRole: string }) {
  const model = 'gemini-3-flash-preview'
  const prompt = `Basé sur ces compétences: ${profile.skills.join(', ')} et ce poste cible: ${profile.targetRole}, 
  suggère 5 entreprises françaises (réelles) et 3 types de secteurs porteurs pour ce profil.
  Réponds en JSON avec les clés 'companies' (array de strings) et 'sectors' (array de strings).`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    })
    return JSON.parse(response.text)
  } catch (error) {
    return { companies: [], sectors: [] }
  }
}
