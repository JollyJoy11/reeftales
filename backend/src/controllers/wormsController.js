const { GoogleGenAI } = require('@google/genai')
const fs = require('fs/promises')
const path = require('path')
const {
  createAiIdentification,
  getUserAiIdentifications
} = require('../models/aiIdentificationModel')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

function normalizeName(name = '') {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function isAccepted(record) {
  return record.status?.toLowerCase() === 'accepted'
}

function rankScore(record) {
  const rank = record.rank?.toLowerCase()

  if (rank === 'species') return 0
  if (rank === 'subspecies') return 2
  return 1
}

function curateWormsMatches(records, queryName) {
  const query = normalizeName(queryName)
  const mapped = records.map((record) => ({
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

  const sorted = mapped.sort((a, b) => {
    const aName = normalizeName(a.acceptedName || a.scientificName)
    const bName = normalizeName(b.acceptedName || b.scientificName)

    return (
      Number(bName === query) - Number(aName === query) ||
      Number(isAccepted(b)) - Number(isAccepted(a)) ||
      rankScore(a) - rankScore(b) ||
      aName.localeCompare(bName)
    )
  })

  const byAcceptedName = new Map()

  sorted.forEach((record) => {
    const key = normalizeName(record.acceptedName || record.scientificName)
    if (!key || byAcceptedName.has(key)) return
    byAcceptedName.set(key, record)
  })

  const uniqueMatches = [...byAcceptedName.values()]
  const speciesMatch = uniqueMatches.find((record) => {
    return isAccepted(record) && record.rank?.toLowerCase() === 'species'
  })

  if (!speciesMatch) {
    return uniqueMatches.slice(0, 5)
  }

  const speciesName = normalizeName(speciesMatch.acceptedName || speciesMatch.scientificName)
  const cleanedMatches = uniqueMatches.filter((record) => {
    const rank = record.rank?.toLowerCase()
    const acceptedName = normalizeName(record.acceptedName || record.scientificName)

    if (record.aphiaId === speciesMatch.aphiaId) return true
    if (rank === 'subspecies') return false
    return acceptedName !== speciesName
  })

  return cleanedMatches.slice(0, 5)
}

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

    return curateWormsMatches(records, name)
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

async function saveIdentificationImage(req) {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'identifications')
  await fs.mkdir(uploadDir, { recursive: true })

  const ext = path.extname(req.file.originalname || '') || '.jpg'
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-ai-identification${ext}`
  const filepath = path.join(uploadDir, filename)

  await fs.writeFile(filepath, req.file.buffer)

  return `${req.protocol}://${req.get('host')}/uploads/identifications/${filename}`
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
    const primaryMatch = wormsMatches[0]
    let identificationId = null
    let imageUrl = null

    if (req.user?.id) {
      imageUrl = await saveIdentificationImage(req)
      identificationId = await createAiIdentification(req.user.id, {
        imageUrl,
        commonName: aiPrediction.commonName,
        scientificName: aiPrediction.scientificName,
        confidence: aiPrediction.confidence,
        reason: aiPrediction.reason,
        aphiaId: primaryMatch?.aphiaId,
        acceptedName: primaryMatch?.acceptedName,
        taxonomyStatus: primaryMatch?.status,
        rankName: primaryMatch?.rank,
        wormsUrl: primaryMatch?.wormsUrl
      })
    }

    res.json({
      aiPrediction,
      wormsMatches,
      savedIdentification: identificationId
        ? { id: identificationId, imageUrl }
        : null
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to identify image' })
  }
}

async function fetchMyIdentifications(req, res) {
  try {
    const identifications = await getUserAiIdentifications(req.user.id)
    res.json(identifications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch AI identifications' })
  }
}

module.exports = {
  searchWorms,
  identifyImage,
  fetchMyIdentifications
}
