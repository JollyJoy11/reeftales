const fs = require('fs')
const path = require('path')
const { v2: cloudinary } = require('cloudinary')
require('dotenv').config()

const species = [
  { slug: 'green-sea-turtle', name: 'Green Sea Turtle', query: 'Chelonia mydas' },
  { slug: 'whale-shark', name: 'Whale Shark', query: 'Rhincodon typus' },
  { slug: 'clownfish', name: 'Clownfish', query: 'Amphiprioninae clownfish' },
  { slug: 'reef-manta-ray', name: 'Reef Manta Ray', query: 'Mobula alfredi' },
  { slug: 'blacktip-reef-shark', name: 'Blacktip Reef Shark', query: 'Carcharhinus melanopterus' },
  { slug: 'blue-tang', name: 'Blue Tang', query: 'Paracanthurus hepatus' },
  { slug: 'parrotfish', name: 'Parrotfish', query: 'parrotfish reef' },
  { slug: 'brain-coral', name: 'Brain Coral', query: 'brain coral' },
  { slug: 'sea-anemone', name: 'Sea Anemone', query: 'sea anemone reef' },
  { slug: 'moon-jellyfish', name: 'Moon Jellyfish', query: 'Aurelia aurita' },
  { slug: 'hawksbill-turtle', name: 'Hawksbill Turtle', query: 'Eretmochelys imbricata' },
  { slug: 'great-barracuda', name: 'Great Barracuda', query: 'Sphyraena barracuda' },
  { slug: 'moorish-idol', name: 'Moorish Idol', query: 'Zanclus cornutus' },
  { slug: 'giant-clam', name: 'Giant Clam', query: 'Tridacna gigas' },
  { slug: 'staghorn-coral', name: 'Staghorn Coral', query: 'Acropora cervicornis' },
  { slug: 'table-coral', name: 'Table Coral', query: 'Acropora hyacinthus table coral' },
  { slug: 'eagle-ray', name: 'Eagle Ray', query: 'Aetobatus narinari eagle ray' },
  { slug: 'blue-sea-star', name: 'Blue Sea Star', query: 'Linckia laevigata' },
  { slug: 'napoleon-wrasse', name: 'Napoleon Wrasse', query: 'Cheilinus undulatus' },
  { slug: 'octopus', name: 'Octopus', query: 'octopus reef' },
  { slug: 'grey-reef-shark', name: 'Grey Reef Shark', query: 'Carcharhinus amblyrhynchos' },
  { slug: 'butterflyfish', name: 'Butterflyfish', query: 'Chaetodontidae butterflyfish' },
  { slug: 'crown-jellyfish', name: 'Crown Jellyfish', query: 'Cephea cephea' },
  { slug: 'sea-fan-coral', name: 'Sea Fan Coral', query: 'sea fan coral gorgonia' },
  { slug: 'stingray', name: 'Stingray', query: 'stingray reef' }
]

const outputPath = path.join(__dirname, '..', 'src', 'database', 'seedSpeciesImages.generated.json')

function requiredEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required in backend/.env`)
  }
}

function cleanHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getMeta(extmetadata = {}, key) {
  return cleanHtml(extmetadata[key]?.value)
}

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '8',
    gsrsearch: query,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1200'
  })

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: {
      'User-Agent': 'ReefTales student project image seeder'
    }
  })

  if (!response.ok) {
    throw new Error(`Wikimedia request failed for ${query}`)
  }

  const data = await response.json()
  const pages = Object.values(data.query?.pages || {})

  return pages
    .map(page => ({
      title: page.title,
      image: page.imageinfo?.[0]
    }))
    .filter(item => item.image?.url && item.image?.mime?.startsWith('image/'))
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry(label, task, attempts = 3) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      console.warn(`${label} failed on attempt ${attempt}/${attempts}: ${error.message || error}`)

      if (attempt < attempts) {
        await wait(1500 * attempt)
      }
    }
  }

  throw lastError
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ReefTales student project image seeder'
    }
  })

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error)
        return
      }

      resolve(result)
    })

    stream.end(buffer)
  })
}

function pickImage(results) {
  return results.find(result => {
    const license = getMeta(result.image.extmetadata, 'LicenseShortName').toLowerCase()
    return license.includes('cc') || license.includes('public domain')
  }) || results[0]
}

async function uploadSpeciesImage(item) {
  const results = await searchCommons(item.query)
  const picked = pickImage(results)

  if (!picked) {
    throw new Error(`No Wikimedia image found for ${item.name}`)
  }

  const imageUrl = picked.image.thumburl || picked.image.url
  const imageBuffer = await withRetry(
    `Download ${item.name}`,
    () => downloadImage(imageUrl)
  )

  const upload = await withRetry(
    `Upload ${item.name}`,
    () => uploadBuffer(imageBuffer, {
      public_id: `reeftales/seeds/species/${item.slug}`,
      overwrite: true,
      unique_filename: false,
      resource_type: 'image',
      timeout: 120000
    })
  )

  const metadata = picked.image.extmetadata || {}

  return {
    name: item.name,
    cloudinaryUrl: upload.secure_url,
    sourceUrl: getMeta(metadata, 'LicenseUrl') || getMeta(metadata, 'DescriptionUrl') || picked.image.descriptionurl || picked.image.url,
    commonsFile: picked.image.descriptionurl || picked.image.url,
    creator: getMeta(metadata, 'Artist') || 'Wikimedia Commons contributor',
    license: getMeta(metadata, 'LicenseShortName') || 'See Wikimedia Commons file page',
    wikimediaTitle: picked.title
  }
}

async function main() {
  requiredEnv('CLOUDINARY_CLOUD_NAME')
  requiredEnv('CLOUDINARY_API_KEY')
  requiredEnv('CLOUDINARY_API_SECRET')

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })

  const output = {}

  for (const item of species) {
    console.log(`Uploading ${item.name}...`)
    output[item.slug] = await uploadSpeciesImage(item)
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Saved species image mapping to ${outputPath}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
