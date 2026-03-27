import { GoogleGenAI, Type } from '@google/genai'

type FrontAiProvider = 'mistral' | 'gemini' | 'none'

function resolveFrontProvider(): FrontAiProvider {
  const raw = String(import.meta.env.VITE_AI_PROVIDER ?? import.meta.env.AI_PROVIDER ?? 'none')
    .trim()
    .toLowerCase()
  if (raw === 'mistral') return 'mistral'
  if (raw === 'gemini') return 'gemini'
  return 'none'
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = String(import.meta.env.VITE_GEMINI_API_KEY ?? '').trim()
  if (resolveFrontProvider() !== 'gemini' || !apiKey) return null
  return new GoogleGenAI({ apiKey })
}

function getMistralApiKey(): string | null {
  const apiKey = String(
    import.meta.env.VITE_MISTRAL_API_KEY ?? import.meta.env.AI_API_KEY ?? ''
  ).trim()
  if (resolveFrontProvider() !== 'mistral' || !apiKey) return null
  return apiKey
}

async function mistralJson<T>(prompt: string): Promise<T | null> {
  const apiKey = getMistralApiKey()
  if (!apiKey) return null

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json?.message || `Mistral HTTP ${response.status}`)
  }

  const content = json?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) return null
  return JSON.parse(content) as T
}

async function mistralText(prompt: string): Promise<string | null> {
  const apiKey = getMistralApiKey()
  if (!apiKey) return null

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json?.message || `Mistral HTTP ${response.status}`)
  }

  const content = json?.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : null
}

export async function suggestSkillMapping(jobTitle: string) {
  if (resolveFrontProvider() === 'mistral') {
    const prompt = `En tant qu'expert en bilan de compétences et VAE, suggère une structure de compétences pour le poste de "${jobTitle}".
Propose 3 missions principales. Pour chaque mission, liste 2 activités concrètes typiques de ce métier.
Réponds exclusivement en JSON avec cette structure: {"items":[{"mission":"string","activities":["string","string"]}]}.`
    try {
      const data = await mistralJson<{ items?: Array<{ mission: string; activities: string[] }> }>(
        prompt
      )
      return data?.items ?? []
    } catch {
      return []
    }
  }
  const ai = getGeminiClient()
  if (!ai) return []
  const model = 'gemini-2.0-flash'
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
    return JSON.parse(response.text || '[]')
  } catch (error) {
    console.error('Gemini Suggestion error:', error)
    return []
  }
}

export async function extractSkillMappingFromText(text: string) {
  if (resolveFrontProvider() === 'mistral') {
    const prompt = `Analyse le récit d'expérience suivant : "${text}".
Extrais les missions principales et les activités liées mentionnées.
Réponds exclusivement en JSON avec cette structure:
{"mapping":[{"mission":"string","activity":"string","proof":"string"}]}`
    try {
      const data = await mistralJson<{
        mapping?: Array<{ mission: string; activity: string; proof: string }>
      }>(prompt)
      return { mapping: data?.mapping ?? [] }
    } catch {
      return { mapping: [] }
    }
  }
  const ai = getGeminiClient()
  if (!ai) return { mapping: [] }
  const model = 'gemini-2.0-flash'
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
    return JSON.parse(response.text || '{"mapping":[]}')
  } catch (error) {
    console.error('Gemini Narrative error:', error)
    return { mapping: [] }
  }
}

export async function challengeProof(activity: string, proof: string) {
  if (resolveFrontProvider() === 'mistral') {
    const prompt = `Un candidat décrit son activité : "${activity}". Sa preuve actuelle est : "${proof}".
Pose une seule question très courte (max 15 mots) pour l'aider à quantifier ou illustrer son succès.`
    try {
      return (await mistralText(prompt)) || "Pouvez-vous préciser l'impact ou l'outil utilisé ?"
    } catch {
      return "Pouvez-vous préciser l'impact ou l'outil utilisé ?"
    }
  }
  const ai = getGeminiClient()
  if (!ai) return "Pouvez-vous préciser l'impact ou l'outil utilisé ?"
  const model = 'gemini-2.0-flash'
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

export async function analyzeExerciseResult(type: string, data: unknown): Promise<string> {
  if (resolveFrontProvider() === 'mistral') {
    const prompt = `Analyse professionnelle pour un accompagnement carrière : ${type}. Données : ${JSON.stringify(data)}.
Produis une analyse courte (max 4 phrases), encourageante, vitaminée, avec un conseil concret basé sur les données reçues.`
    try {
      return (await mistralText(prompt)) || 'Analyse indisponible.'
    } catch {
      return "Erreur lors de la génération de l'analyse."
    }
  }
  const ai = getGeminiClient()
  if (!ai) return "Analyse indisponible : Gemini n'est pas configuré côté navigateur."
  const model = 'gemini-2.0-flash'
  const prompt = `Analyse professionnelle pour un accompagnement carrière : ${type}. Données : ${JSON.stringify(data)}.
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
  if (resolveFrontProvider() === 'mistral') {
    const prompt = `Analyse ce CV encodé en base64 (mimeType: ${mimeType}) et extrais les informations structurées.
Réponds exclusivement en JSON avec ce schéma:
{
  "name":"string",
  "email":"string",
  "currentRole":"string",
  "suggestedTargetRole":"string",
  "summary":"string",
  "skills":[{"name":"string","level":3}],
  "experiences":[{"id":"string","title":"string","company":"string","type":"CDI","startDate":"","endDate":"","isCurrent":false,"description":""}],
  "educations":[{"id":"string","degree":"string","school":"string","startDate":"","endDate":"","isCurrent":false,"description":""}]
}
CV base64 (tronqué possible): ${base64File.slice(0, 40000)}`
    try {
      const data = await mistralJson<any>(prompt)
      if (!data) return null
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
    } catch (error) {
      console.error('Mistral CV Extraction error:', error)
      return null
    }
  }
  const ai = getGeminiClient()
  if (!ai) return null
  const model = 'gemini-2.0-flash'
  const prompt = `Analyse ce CV et extrais les informations suivantes de manière structurée. 
  Réponds exclusivement en JSON.`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64File.includes(',') ? base64File.split(',')[1] : base64File,
              mimeType,
            },
          },
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
  if (resolveFrontProvider() === 'mistral') {
    const prompt = `Basé sur ces compétences: ${profile.skills.join(', ')} et ce poste cible: ${profile.targetRole},
suggère 5 entreprises françaises (réelles) et 3 secteurs porteurs.
Réponds en JSON avec {"companies":["..."],"sectors":["..."]}.`
    try {
      const data = await mistralJson<{ companies?: string[]; sectors?: string[] }>(prompt)
      return { companies: data?.companies ?? [], sectors: data?.sectors ?? [] }
    } catch {
      return { companies: [], sectors: [] }
    }
  }
  const ai = getGeminiClient()
  if (!ai) return { companies: [], sectors: [] }
  const model = 'gemini-2.0-flash'
  const prompt = `Basé sur ces compétences: ${profile.skills.join(', ')} et ce poste cible: ${profile.targetRole}, 
  suggère 5 entreprises françaises (réelles) et 3 types de secteurs porteurs pour ce profil.
  Réponds en JSON avec les clés 'companies' (array de strings) et 'sectors' (array de strings).`

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    })
    return JSON.parse(response.text || '{"companies":[],"sectors":[]}')
  } catch (error) {
    return { companies: [], sectors: [] }
  }
}

