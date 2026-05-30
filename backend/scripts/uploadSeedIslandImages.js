const fs = require('fs')
const path = require('path')
const { v2: cloudinary } = require('cloudinary')
require('dotenv').config()

const islands = [
  {
    slug: 'maldives',
    name: 'Maldives',
    sourceUrl: 'https://www.pexels.com/photo/beach-island-under-blue-sky-12807060/',
    creator: 'Asad Photo Maldives',
    license: 'Pexels License'
  },
  {
    slug: 'bora-bora',
    name: 'Bora Bora',
    sourceUrl: 'https://www.pexels.com/photo/stunning-bora-bora-lagoon-and-overwater-bungalows-34095820/',
    creator: 'Adrien Daurenjou',
    license: 'Pexels License'
  },
  {
    slug: 'maui',
    name: 'Maui',
    sourceUrl: 'https://unsplash.com/photos/a-lush-coastline-meets-the-blue-ocean-EmBdsQLLIzA',
    creator: 'Cody McLain',
    license: 'Unsplash License'
  },
  {
    slug: 'sipadan',
    name: 'Sipadan Island',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sipadan_Island,_Sabah,_Malaysia.jpg',
    creator: 'Eric and Kelly Chan',
    license: 'Creative Commons license listed on Wikimedia Commons file page; keep attribution and license link'
  },
  {
    slug: 'redang',
    name: 'Redang Island',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Redang_Island.jpg',
    creator: 'WorldTravleerAndPhotoTaker',
    license: 'CC BY-SA 4.0; attribution and share-alike required'
  },
  {
    slug: 'tioman',
    name: 'Tioman Island',
    sourceUrl: 'https://unsplash.com/photos/a-sandy-beach-with-a-small-island-in-the-distance--ZCIzM4mwxQ',
    creator: 'Kharl Anthony Paica',
    license: 'Unsplash License'
  },
  {
    slug: 'perhentian',
    name: 'Perhentian Islands',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Perhentian_Islands,_Malaysia,_Palms_on_the_beach.jpg',
    creator: 'Vyacheslav Argenberg',
    license: 'CC BY 4.0; attribution required'
  },
  {
    slug: 'great-barrier-reef',
    name: 'Great Barrier Reef',
    sourceUrl: 'https://www.pexels.com/photo/scenic-photo-of-coral-reef-3157890/',
    creator: 'Francesco Ungaro',
    license: 'Pexels License'
  },
  {
    slug: 'raja-ampat',
    name: 'Raja Ampat',
    sourceUrl: 'https://www.pexels.com/photo/breathtaking-aerial-view-of-raja-ampat-islands-32157316/',
    creator: 'Angke Widya',
    license: 'Pexels License'
  },
  {
    slug: 'komodo',
    name: 'Komodo Island',
    sourceUrl: 'https://www.pexels.com/photo/top-view-of-komodo-national-park-indonesia-16281383/',
    creator: 'Bayu Samudro',
    license: 'Pexels License'
  },
  {
    slug: 'palawan',
    name: 'Palawan',
    sourceUrl: 'https://unsplash.com/photos/an-aerial-view-of-a-tropical-island-with-a-lagoon-AtlL6kSJDik',
    creator: 'Yasintha Perera',
    license: 'Unsplash License'
  },
  {
    slug: 'fiji',
    name: 'Fiji',
    sourceUrl: 'https://www.pexels.com/photo/aerial-view-of-houses-and-green-trees-near-mountains-and-body-of-water-4784462/',
    creator: 'Jess Loiterton',
    license: 'Pexels License'
  }
]

const inputDir = path.join(__dirname, '..', 'seed-images', 'islands')
const outputPath = path.join(__dirname, '..', 'src', 'database', 'seedIslandImages.generated.json')
const extensions = ['.jpg', '.jpeg', '.png', '.webp']

function requiredEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required in backend/.env`)
  }
}

function findImage(slug) {
  for (const extension of extensions) {
    const filePath = path.join(inputDir, `${slug}${extension}`)

    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  throw new Error(`Missing image for ${slug}. Add ${slug}.jpg to ${inputDir}`)
}

async function uploadIslandImage(item) {
  const filePath = findImage(item.slug)

  const upload = await cloudinary.uploader.upload(filePath, {
    public_id: `reeftales/seeds/islands/${item.slug}`,
    overwrite: true,
    unique_filename: false,
    resource_type: 'image'
  })

  return {
    name: item.name,
    cloudinaryUrl: upload.secure_url,
    sourceUrl: item.sourceUrl,
    creator: item.creator,
    license: item.license
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

  for (const item of islands) {
    console.log(`Uploading ${item.name}...`)
    output[item.slug] = await uploadIslandImage(item)
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Saved island image mapping to ${outputPath}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
