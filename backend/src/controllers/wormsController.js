const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

async function lookupWormsByName(name) {
  try {
    const endpoint = new URL(
      `https://www.marinespecies.org/rest/AphiaRecordsByName/${encodeURIComponent(name)}`
    )

    endpoint.searchParams.set('like', 'true')
    endpoint.searchParams.set('marine_only', 'true')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(endpoint, {
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return []
    }

    const records = await response.json()

    return records.slice(0, 5).map((record) => ({
      aphiaId: record.AphiaID,
      scientificName: record.scientificname,
      acceptedName: record.valid_name,
      authority: record.authority,
      status: record.status,
      rank: record.rank,
      kingdom: record.kingdom,
      phylum: record.phylum,
      className: record.class,
      family: record.family,
      wormsUrl: record.url
    }))
  } catch (error) {
    console.error('WoRMS lookup failed:', error.message)
    return []
  }
}

async function searchWorms(req, res) {
  const name = req.query.name?.trim()

  if (!name) {
    return res.status(400).json({ message: 'Species name is required' })
  }

  try {
    const matches = await lookupWormsByName(name)
    res.json(matches)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to search WoRMS' })
  }
}

async function identifyImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required' })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Gemini API key is missing' })
  }

  try {
    const base64Image = req.file.buffer.toString('base64')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `
Identify the most likely marine animal, coral, or sea species in this image.

Return ONLY JSON:
{
  "commonName": "",
  "scientificName": "",
  "confidence": "",
  "reason": ""
}
          `
        },
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64Image
          }
        }
      ]
    })

    const cleanedText = response.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const aiPrediction = JSON.parse(cleanedText)

    const queryName =
      aiPrediction.scientificName ||
      aiPrediction.commonName

    const wormsMatches = await lookupWormsByName(queryName)

    res.json({
      aiPrediction,
      wormsMatches
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to identify image' })
  }
}

module.exports = {
  searchWorms,
  identifyImage
}