const bcrypt = require('bcrypt')
const islandImages = require('./seedIslandImages.generated.json')
const speciesImages = require('./seedSpeciesImages.generated.json')

const fallbackImage = '/images/island-placeholder.jpg'
const seedImageBase = process.env.SEED_IMAGE_BASE_URL

function seedImage(folder, filename) {
  return seedImageBase
    ? `${seedImageBase.replace(/\/$/, '')}/${folder}/${filename}`
    : fallbackImage
}

function islandImage(slug, filename) {
  return islandImages[slug]?.cloudinaryUrl || seedImage('islands', filename)
}

function speciesImage(slug, filename) {
  return speciesImages[slug]?.cloudinaryUrl || seedImage('species', filename)
}

async function insertIgnore(connection, table, columns, rows) {
  if (!rows.length) return

  await connection.query(
    `INSERT IGNORE INTO ${table} (${columns.join(', ')}) VALUES ?`,
    [rows.map(row => columns.map(column => row[column] ?? null))]
  )
}

async function insertIfMissing(connection, table, uniqueColumns, columns, rows) {
  for (const row of rows) {
    const whereClause = uniqueColumns
      .map(column => `${column} <=> ?`)
      .join(' AND ')

    const [existing] = await connection.query(
      `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`,
      uniqueColumns.map(column => row[column] ?? null)
    )

    if (existing.length) continue

    await connection.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map(column => row[column] ?? null)
    )
  }
}

async function seedDatabase(connection) {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10)

    await insertIgnore(connection, 'users', [
      'id',
      'username',
      'email',
      'password',
      'bio'
    ], [
      {
        id: 1,
        username: 'oceanlover',
        email: 'ocean@example.com',
        password: hashedPassword,
        bio: 'Diver exploring tropical islands'
      },
      {
        id: 2,
        username: 'coralqueen',
        email: 'coral@example.com',
        password: hashedPassword,
        bio: 'Marine life enthusiast'
      },
      {
        id: 3,
        username: 'reefmapper',
        email: 'mapper@example.com',
        password: hashedPassword,
        bio: 'Planning reef-friendly island trips'
      }
    ])

    const islands = [
      {
        id: 1,
        name: 'Maldives',
        location: 'South Asia',
        country: 'Maldives',
        continent: 'Asia',
        description: 'Crystal-clear lagoons, coral atolls, manta cleaning stations, and calm island escapes.',
        cover_image: islandImage('maldives', 'maldives.jpg'),
        best_visit_time: 'November - April',
        latitude: 3.2028,
        longitude: 73.2207,
        marine_latitude: 3.2028,
        marine_longitude: 73.2207
      },
      {
        id: 2,
        name: 'Bora Bora',
        location: 'French Polynesia',
        country: 'France',
        continent: 'Oceania',
        description: 'A turquoise lagoon destination known for reef snorkeling, rays, and dramatic volcanic scenery.',
        cover_image: islandImage('bora-bora', 'bora-bora.jpg'),
        best_visit_time: 'May - October',
        latitude: -16.5004,
        longitude: -151.7415,
        marine_latitude: -16.5004,
        marine_longitude: -151.7415
      },
      {
        id: 3,
        name: 'Maui',
        location: 'Hawaii',
        country: 'USA',
        continent: 'North America',
        description: 'Volcanic coastline, turtle encounters, reef coves, and seasonal whale watching.',
        cover_image: islandImage('maui', 'maui.jpg'),
        best_visit_time: 'April - October',
        latitude: 20.7984,
        longitude: -156.3319,
        marine_latitude: 20.7350,
        marine_longitude: -156.4550
      },
      {
        id: 4,
        name: 'Sipadan Island',
        location: 'Sabah',
        country: 'Malaysia',
        continent: 'Asia',
        description: 'World-famous scuba diving destination with turtles, reef sharks, and schooling barracuda.',
        cover_image: islandImage('sipadan', 'sipadan.jpg'),
        best_visit_time: 'April - December',
        latitude: 4.1148,
        longitude: 118.6287,
        marine_latitude: 4.1148,
        marine_longitude: 118.6287
      },
      {
        id: 5,
        name: 'Redang Island',
        location: 'Terengganu',
        country: 'Malaysia',
        continent: 'Asia',
        description: 'A Malaysian snorkeling paradise with gentle reefs, clear water, and turtle sightings.',
        cover_image: islandImage('redang', 'redang.jpg'),
        best_visit_time: 'March - October',
        latitude: 5.7833,
        longitude: 103.0333,
        marine_latitude: 5.7833,
        marine_longitude: 103.0333
      },
      {
        id: 6,
        name: 'Tioman Island',
        location: 'Pahang',
        country: 'Malaysia',
        continent: 'Asia',
        description: 'Rainforest-backed beaches, dive sites, and relaxed reef villages on Malaysia’s east coast.',
        cover_image: islandImage('tioman', 'tioman.jpg'),
        best_visit_time: 'March - October',
        latitude: 2.7902,
        longitude: 104.1698,
        marine_latitude: 2.7902,
        marine_longitude: 104.1698
      },
      {
        id: 7,
        name: 'Perhentian Islands',
        location: 'Terengganu',
        country: 'Malaysia',
        continent: 'Asia',
        description: 'Twin island escape with shallow reefs, beach trails, turtles, and beginner-friendly snorkeling.',
        cover_image: islandImage('perhentian', 'perhentian.jpg'),
        best_visit_time: 'March - October',
        latitude: 5.9167,
        longitude: 102.7333,
        marine_latitude: 5.9167,
        marine_longitude: 102.7333
      },
      {
        id: 8,
        name: 'Great Barrier Reef',
        location: 'Queensland',
        country: 'Australia',
        continent: 'Oceania',
        description: 'The world’s largest coral reef system with vast biodiversity and iconic reef formations.',
        cover_image: islandImage('great-barrier-reef', 'great-barrier-reef.jpg'),
        best_visit_time: 'June - October',
        latitude: -18.2871,
        longitude: 147.6992,
        marine_latitude: -18.2871,
        marine_longitude: 147.6992
      },
      {
        id: 9,
        name: 'Raja Ampat',
        location: 'West Papua',
        country: 'Indonesia',
        continent: 'Asia',
        description: 'A remote archipelago with some of the highest reef biodiversity on Earth.',
        cover_image: islandImage('raja-ampat', 'raja-ampat.jpg'),
        best_visit_time: 'October - April',
        latitude: -0.7893,
        longitude: 130.6765,
        marine_latitude: -0.7893,
        marine_longitude: 130.6765
      },
      {
        id: 10,
        name: 'Komodo Island',
        location: 'East Nusa Tenggara',
        country: 'Indonesia',
        continent: 'Asia',
        description: 'Current-swept dive sites, manta encounters, coral gardens, and rugged island viewpoints.',
        cover_image: islandImage('komodo', 'komodo.jpg'),
        best_visit_time: 'April - November',
        latitude: -8.5500,
        longitude: 119.4500,
        marine_latitude: -8.5500,
        marine_longitude: 119.4500
      },
      {
        id: 11,
        name: 'Palawan',
        location: 'Mimaropa',
        country: 'Philippines',
        continent: 'Asia',
        description: 'Limestone lagoons, island hopping routes, reefs, wreck dives, and clear tropical water.',
        cover_image: islandImage('palawan', 'palawan.jpg'),
        best_visit_time: 'November - May',
        latitude: 9.8349,
        longitude: 118.7384,
        marine_latitude: 9.8349,
        marine_longitude: 118.7384
      },
      {
        id: 12,
        name: 'Fiji',
        location: 'South Pacific',
        country: 'Fiji',
        continent: 'Oceania',
        description: 'Soft coral reefs, warm island culture, blue lagoons, and colorful reef fish.',
        cover_image: islandImage('fiji', 'fiji.jpg'),
        best_visit_time: 'May - October',
        latitude: -17.7134,
        longitude: 178.0650,
        marine_latitude: -17.7134,
        marine_longitude: 178.0650
      }
    ]

    await insertIgnore(connection, 'islands', [
      'id',
      'name',
      'location',
      'country',
      'continent',
      'description',
      'cover_image',
      'best_visit_time',
      'latitude',
      'longitude',
      'marine_latitude',
      'marine_longitude'
    ], islands)

    for (const island of islands) {
      await connection.query(`
        UPDATE islands
        SET
          description = ?,
          cover_image = ?,
          best_visit_time = ?,
          latitude = ?,
          longitude = ?,
          marine_latitude = ?,
          marine_longitude = ?
        WHERE id = ?
      `, [
        island.description,
        island.cover_image,
        island.best_visit_time,
        island.latitude,
        island.longitude,
        island.marine_latitude,
        island.marine_longitude,
        island.id
      ])
    }

    await insertIgnore(connection, 'activities', [
      'id',
      'name',
      'description',
      'icon'
    ], [
      { id: 1, name: 'Snorkeling', description: 'Explore shallow coral reefs', icon: 'water' },
      { id: 2, name: 'Scuba Diving', description: 'Dive deeper underwater', icon: 'fish' },
      { id: 3, name: 'Island Hopping', description: 'Visit nearby islands', icon: 'map' },
      { id: 4, name: 'Sunset Watching', description: 'Relax by the ocean', icon: 'sun' },
      { id: 5, name: 'Kayaking', description: 'Paddle through lagoons', icon: 'boat' },
      { id: 6, name: 'Reef Photography', description: 'Capture underwater memories', icon: 'camera' },
      { id: 7, name: 'Wildlife Watching', description: 'Observe marine and coastal wildlife', icon: 'binoculars' }
    ])

    await insertIgnore(connection, 'island_activities', [
      'island_id',
      'activity_id'
    ], [
      { island_id: 1, activity_id: 1 },
      { island_id: 1, activity_id: 2 },
      { island_id: 1, activity_id: 5 },
      { island_id: 2, activity_id: 1 },
      { island_id: 2, activity_id: 3 },
      { island_id: 2, activity_id: 4 },
      { island_id: 3, activity_id: 1 },
      { island_id: 3, activity_id: 4 },
      { island_id: 3, activity_id: 7 },
      { island_id: 4, activity_id: 1 },
      { island_id: 4, activity_id: 2 },
      { island_id: 4, activity_id: 6 },
      { island_id: 5, activity_id: 1 },
      { island_id: 5, activity_id: 5 },
      { island_id: 6, activity_id: 1 },
      { island_id: 6, activity_id: 2 },
      { island_id: 7, activity_id: 1 },
      { island_id: 7, activity_id: 3 },
      { island_id: 8, activity_id: 1 },
      { island_id: 8, activity_id: 2 },
      { island_id: 8, activity_id: 6 },
      { island_id: 9, activity_id: 2 },
      { island_id: 9, activity_id: 6 },
      { island_id: 10, activity_id: 2 },
      { island_id: 10, activity_id: 7 },
      { island_id: 11, activity_id: 3 },
      { island_id: 11, activity_id: 5 },
      { island_id: 12, activity_id: 1 },
      { island_id: 12, activity_id: 2 }
    ])

    const species = [
      { id: 1, name: 'Green Sea Turtle', category: 'turtle', scientific_name: 'Chelonia mydas', conservation_status: 'Endangered', habitats: 'Sipadan, Redang, Perhentian, Maldives, Fiji', min_depth: 1, max_depth: 30, description: 'A gentle marine turtle commonly seen around coral reefs and seagrass beds.', image_url: speciesImage('green-sea-turtle', 'green-sea-turtle.jpg'), tags: 'Herbivore,Friendly,Reef', api_source: 'manual', external_id: null },
      { id: 2, name: 'Whale Shark', category: 'shark', scientific_name: 'Rhincodon typus', conservation_status: 'Endangered', habitats: 'Maldives, Palawan, Raja Ampat, Ningaloo Reef', min_depth: 0, max_depth: 50, description: 'The largest fish in the ocean, often seen in warm tropical waters.', image_url: speciesImage('whale-shark', 'whale-shark.jpg'), tags: 'Gentle Giant,Pelagic,Filter Feeder', api_source: 'manual', external_id: null },
      { id: 3, name: 'Clownfish', category: 'fish', scientific_name: 'Amphiprioninae', conservation_status: 'Least Concern', habitats: 'Great Barrier Reef, Maldives, Indonesia, Fiji', min_depth: 1, max_depth: 15, description: 'A small reef fish commonly found living among sea anemones.', image_url: speciesImage('clownfish', 'clownfish.jpg'), tags: 'Reef,Small Fish,Anemone', api_source: 'manual', external_id: null },
      { id: 4, name: 'Reef Manta Ray', category: 'ray', scientific_name: 'Mobula alfredi', conservation_status: 'Vulnerable', habitats: 'Maldives, Raja Ampat, Komodo, Fiji', min_depth: 5, max_depth: 40, description: 'A graceful ray often seen gliding through tropical reefs and cleaning stations.', image_url: speciesImage('reef-manta-ray', 'reef-manta-ray.jpg'), tags: 'Gentle,Reef,Open Water', api_source: 'manual', external_id: null },
      { id: 5, name: 'Blacktip Reef Shark', category: 'shark', scientific_name: 'Carcharhinus melanopterus', conservation_status: 'Vulnerable', habitats: 'Sipadan, Maldives, Great Barrier Reef, Fiji', min_depth: 1, max_depth: 75, description: 'A reef-associated shark commonly spotted around coral slopes and lagoon edges.', image_url: speciesImage('blacktip-reef-shark', 'blacktip-reef-shark.jpg'), tags: 'Predator,Reef,Fast Swimmer', api_source: 'manual', external_id: null },
      { id: 6, name: 'Blue Tang', category: 'fish', scientific_name: 'Paracanthurus hepatus', conservation_status: 'Least Concern', habitats: 'Great Barrier Reef, Fiji, Indonesia', min_depth: 2, max_depth: 40, description: 'A bright blue reef fish known for vivid colour and active swimming behaviour.', image_url: speciesImage('blue-tang', 'blue-tang.jpg'), tags: 'Reef,Colourful,Small Fish', api_source: 'manual', external_id: null },
      { id: 7, name: 'Parrotfish', category: 'fish', scientific_name: 'Scarinae', conservation_status: 'Least Concern', habitats: 'Maldives, Redang, Great Barrier Reef, Palawan', min_depth: 1, max_depth: 30, description: 'A colourful reef fish that helps maintain coral reef health by grazing algae.', image_url: speciesImage('parrotfish', 'parrotfish.jpg'), tags: 'Herbivore,Reef,Colourful', api_source: 'manual', external_id: null },
      { id: 8, name: 'Brain Coral', category: 'coral', scientific_name: 'Diploria labyrinthiformis', conservation_status: 'Near Threatened', habitats: 'Caribbean, Bahamas, Florida Keys', min_depth: 1, max_depth: 30, description: 'A hard coral named for its maze-like surface pattern, often found in shallow reefs.', image_url: speciesImage('brain-coral', 'brain-coral.jpg'), tags: 'Coral,Reef Builder,Slow Growing', api_source: 'manual', external_id: null },
      { id: 9, name: 'Sea Anemone', category: 'other', scientific_name: 'Actiniaria', conservation_status: 'Not Evaluated', habitats: 'Great Barrier Reef, Maldives, Indonesia', min_depth: 1, max_depth: 25, description: 'A soft-bodied marine animal often associated with clownfish and reef ecosystems.', image_url: speciesImage('sea-anemone', 'sea-anemone.jpg'), tags: 'Reef,Symbiosis,Clownfish Habitat', api_source: 'manual', external_id: null },
      { id: 10, name: 'Moon Jellyfish', category: 'jellyfish', scientific_name: 'Aurelia aurita', conservation_status: 'Not Evaluated', habitats: 'Worldwide Coastal Waters', min_depth: 0, max_depth: 20, description: 'A translucent jellyfish often seen drifting slowly in calm coastal waters.', image_url: speciesImage('moon-jellyfish', 'moon-jellyfish.jpg'), tags: 'Drifter,Soft Body,Coastal', api_source: 'manual', external_id: null },
      { id: 11, name: 'Hawksbill Turtle', category: 'turtle', scientific_name: 'Eretmochelys imbricata', conservation_status: 'Critically Endangered', habitats: 'Redang, Perhentian, Maldives, Palawan', min_depth: 1, max_depth: 40, description: 'A reef turtle with a narrow beak that often feeds around coral and sponge habitats.', image_url: speciesImage('hawksbill-turtle', 'hawksbill-turtle.jpg'), tags: 'Turtle,Reef,Endangered', api_source: 'manual', external_id: null },
      { id: 12, name: 'Great Barracuda', category: 'fish', scientific_name: 'Sphyraena barracuda', conservation_status: 'Least Concern', habitats: 'Sipadan, Great Barrier Reef, Fiji', min_depth: 2, max_depth: 50, description: 'A sleek predatory fish that may gather in striking schools around reef drop-offs.', image_url: speciesImage('great-barracuda', 'great-barracuda.jpg'), tags: 'Predator,Schooling,Reef Edge', api_source: 'manual', external_id: null },
      { id: 13, name: 'Moorish Idol', category: 'fish', scientific_name: 'Zanclus cornutus', conservation_status: 'Least Concern', habitats: 'Hawaii, Fiji, Great Barrier Reef', min_depth: 1, max_depth: 30, description: 'A distinctive reef fish with bold black, white, and yellow bands.', image_url: speciesImage('moorish-idol', 'moorish-idol.jpg'), tags: 'Reef,Colourful,Iconic', api_source: 'manual', external_id: null },
      { id: 14, name: 'Giant Clam', category: 'other', scientific_name: 'Tridacna gigas', conservation_status: 'Vulnerable', habitats: 'Great Barrier Reef, Raja Ampat, Fiji', min_depth: 1, max_depth: 20, description: 'A large reef-dwelling clam with colourful mantle tissue and a symbiotic relationship with algae.', image_url: speciesImage('giant-clam', 'giant-clam.jpg'), tags: 'Reef,Filter Feeder,Shellfish', api_source: 'manual', external_id: null },
      { id: 15, name: 'Staghorn Coral', category: 'coral', scientific_name: 'Acropora cervicornis', conservation_status: 'Critically Endangered', habitats: 'Shallow tropical reefs', min_depth: 1, max_depth: 30, description: 'A branching coral that forms important habitat for small reef organisms.', image_url: speciesImage('staghorn-coral', 'staghorn-coral.jpg'), tags: 'Coral,Branching,Habitat', api_source: 'manual', external_id: null },
      { id: 16, name: 'Table Coral', category: 'coral', scientific_name: 'Acropora hyacinthus', conservation_status: 'Near Threatened', habitats: 'Raja Ampat, Great Barrier Reef, Maldives', min_depth: 2, max_depth: 25, description: 'A broad table-shaped coral that shelters reef fish and creates layered reef structure.', image_url: speciesImage('table-coral', 'table-coral.jpg'), tags: 'Coral,Reef Builder,Plate Coral', api_source: 'manual', external_id: null },
      { id: 17, name: 'Eagle Ray', category: 'ray', scientific_name: 'Aetobatus narinari', conservation_status: 'Endangered', habitats: 'Bora Bora, Maldives, Hawaii, Fiji', min_depth: 1, max_depth: 60, description: 'A spotted ray often seen cruising over sandy bottoms and reef edges.', image_url: speciesImage('eagle-ray', 'eagle-ray.jpg'), tags: 'Ray,Graceful,Sandy Bottom', api_source: 'manual', external_id: null },
      { id: 18, name: 'Blue Sea Star', category: 'other', scientific_name: 'Linckia laevigata', conservation_status: 'Not Evaluated', habitats: 'Indonesia, Malaysia, Great Barrier Reef', min_depth: 1, max_depth: 20, description: 'A vivid blue sea star often found on reef flats and coral rubble.', image_url: speciesImage('blue-sea-star', 'blue-sea-star.jpg'), tags: 'Reef,Invertebrate,Colourful', api_source: 'manual', external_id: null },
      { id: 19, name: 'Napoleon Wrasse', category: 'fish', scientific_name: 'Cheilinus undulatus', conservation_status: 'Endangered', habitats: 'Sipadan, Raja Ampat, Great Barrier Reef', min_depth: 2, max_depth: 60, description: 'A large charismatic reef fish recognized by its forehead hump and bold patterning.', image_url: speciesImage('napoleon-wrasse', 'napoleon-wrasse.jpg'), tags: 'Large Fish,Reef,Endangered', api_source: 'manual', external_id: null },
      { id: 20, name: 'Octopus', category: 'other', scientific_name: 'Octopoda', conservation_status: 'Not Evaluated', habitats: 'Rocky reefs, coral reefs, lagoons', min_depth: 1, max_depth: 80, description: 'An intelligent cephalopod known for camouflage, flexible movement, and den behaviour.', image_url: speciesImage('octopus', 'octopus.jpg'), tags: 'Camouflage,Cephalopod,Reef', api_source: 'manual', external_id: null },
      { id: 21, name: 'Grey Reef Shark', category: 'shark', scientific_name: 'Carcharhinus amblyrhynchos', conservation_status: 'Endangered', habitats: 'Raja Ampat, Great Barrier Reef, Fiji', min_depth: 5, max_depth: 100, description: 'A powerful reef shark often found along current-swept reef walls and passes.', image_url: speciesImage('grey-reef-shark', 'grey-reef-shark.jpg'), tags: 'Shark,Reef Wall,Predator', api_source: 'manual', external_id: null },
      { id: 22, name: 'Butterflyfish', category: 'fish', scientific_name: 'Chaetodontidae', conservation_status: 'Least Concern', habitats: 'Tropical coral reefs worldwide', min_depth: 1, max_depth: 40, description: 'Small colourful reef fish often seen in pairs around coral heads.', image_url: speciesImage('butterflyfish', 'butterflyfish.jpg'), tags: 'Reef,Colourful,Pairing', api_source: 'manual', external_id: null },
      { id: 23, name: 'Crown Jellyfish', category: 'jellyfish', scientific_name: 'Cephea cephea', conservation_status: 'Not Evaluated', habitats: 'Indo-Pacific warm waters', min_depth: 0, max_depth: 20, description: 'A rounded jellyfish with ornate lobes and a drifting bell-like form.', image_url: speciesImage('crown-jellyfish', 'crown-jellyfish.jpg'), tags: 'Jellyfish,Drifter,Indo-Pacific', api_source: 'manual', external_id: null },
      { id: 24, name: 'Sea Fan Coral', category: 'coral', scientific_name: 'Gorgonia', conservation_status: 'Not Evaluated', habitats: 'Reef walls, slopes, current-rich areas', min_depth: 5, max_depth: 60, description: 'A fan-shaped soft coral that filters passing plankton from reef currents.', image_url: speciesImage('sea-fan-coral', 'sea-fan-coral.jpg'), tags: 'Soft Coral,Reef Wall,Filter Feeder', api_source: 'manual', external_id: null },
      { id: 25, name: 'Stingray', category: 'ray', scientific_name: 'Dasyatidae', conservation_status: 'Varies by species', habitats: 'Sandy lagoons, reef flats, coastal waters', min_depth: 1, max_depth: 60, description: 'A flat-bodied ray commonly seen gliding over sand near reefs and lagoons.', image_url: speciesImage('stingray', 'stingray.jpg'), tags: 'Ray,Sandy Bottom,Lagoon', api_source: 'manual', external_id: null }
    ]

    await insertIgnore(connection, 'species', [
      'id',
      'name',
      'category',
      'scientific_name',
      'conservation_status',
      'habitats',
      'min_depth',
      'max_depth',
      'description',
      'image_url',
      'tags',
      'api_source',
      'external_id'
    ], species)

    for (const item of species) {
      await connection.query(`
        UPDATE species
        SET
          category = ?,
          scientific_name = ?,
          conservation_status = ?,
          habitats = ?,
          min_depth = ?,
          max_depth = ?,
          description = ?,
          image_url = ?,
          tags = ?
        WHERE id = ?
      `, [
        item.category,
        item.scientific_name,
        item.conservation_status,
        item.habitats,
        item.min_depth,
        item.max_depth,
        item.description,
        item.image_url,
        item.tags,
        item.id
      ])
    }

    const journals = [
      { id: 1, user_id: 1, island_id: 5, title: 'My Magical Redang Adventure', content: 'Spent four incredible days snorkeling around Redang Island. The coral gardens were vibrant and I spotted turtles near the shallow reef.', cover_image: seedImage('journals', 'redang-adventure.jpg'), start_date: '2025-06-15', end_date: '2025-06-18', mood: 'excited', visibility: 'public' },
      { id: 2, user_id: 2, island_id: 4, title: 'Diving Through Sipadan', content: 'One of the best underwater experiences I have ever had. Huge schools of barracuda and reef sharks surrounded the dive site.', cover_image: seedImage('journals', 'sipadan-dive.jpg'), start_date: '2025-05-20', end_date: '2025-05-24', mood: 'amazed', visibility: 'public' },
      { id: 3, user_id: 1, island_id: 1, title: 'Peaceful Evenings in Maldives', content: 'Relaxed by the crystal-clear waters and kayaked through the lagoon during sunset.', cover_image: seedImage('journals', 'maldives-evening.jpg'), start_date: '2025-04-08', end_date: '2025-04-12', mood: 'relaxed', visibility: 'public' },
      { id: 4, user_id: 3, island_id: 9, title: 'Raja Ampat Colour Notes', content: 'Every reef wall felt alive with soft corals, tiny fish, and wide blue water beyond the drop-off.', cover_image: seedImage('journals', 'raja-ampat-colour.jpg'), start_date: '2025-07-02', end_date: '2025-07-07', mood: 'joyful', visibility: 'public' },
      { id: 5, user_id: 2, island_id: 10, title: 'Komodo Current Diary', content: 'The currents were strong, but the manta encounters made every careful drift dive unforgettable.', cover_image: seedImage('journals', 'komodo-current.jpg'), start_date: '2025-08-10', end_date: '2025-08-14', mood: 'adventurous', visibility: 'public' },
      { id: 6, user_id: 1, island_id: 7, title: 'Perhentian Turtle Morning', content: 'Started the day in calm water and watched a turtle move slowly across the seagrass.', cover_image: seedImage('journals', 'perhentian-turtle.jpg'), start_date: '2025-06-04', end_date: '2025-06-06', mood: 'peaceful', visibility: 'public' },
      { id: 7, user_id: 3, island_id: 8, title: 'First Look at the Great Barrier Reef', content: 'The reef stretched further than I could imagine, with bright coral plates and schools of butterflyfish.', cover_image: seedImage('journals', 'great-barrier-reef.jpg'), start_date: '2025-09-01', end_date: '2025-09-05', mood: 'amazed', visibility: 'public' },
      { id: 8, user_id: 2, island_id: 11, title: 'Palawan Lagoon Days', content: 'Island hopping through limestone lagoons felt like moving through a postcard.', cover_image: seedImage('journals', 'palawan-lagoon.jpg'), start_date: '2025-03-18', end_date: '2025-03-22', mood: 'relaxed', visibility: 'public' }
    ]

    await insertIgnore(connection, 'journals', [
      'id',
      'user_id',
      'island_id',
      'title',
      'content',
      'cover_image',
      'start_date',
      'end_date',
      'mood',
      'visibility'
    ], journals)

    await insertIfMissing(connection, 'journal_activities', [
      'journal_id',
      'activity_id',
      'custom_activity_name',
      'day_number',
      'activity_time',
      'notes'
    ], [
      'journal_id',
      'activity_id',
      'custom_activity_name',
      'day_number',
      'activity_time',
      'notes'
    ], [
      { journal_id: 1, activity_id: 1, custom_activity_name: null, day_number: 1, activity_time: '09:00:00', notes: 'Morning snorkeling around coral reef' },
      { journal_id: 1, activity_id: 5, custom_activity_name: null, day_number: 2, activity_time: '17:30:00', notes: 'Sunset kayaking session' },
      { journal_id: 2, activity_id: 2, custom_activity_name: null, day_number: 1, activity_time: '08:00:00', notes: 'Deep dive near Barracuda Point' },
      { journal_id: 2, activity_id: 6, custom_activity_name: null, day_number: 2, activity_time: '14:00:00', notes: 'Captured reef shark footage' },
      { journal_id: 3, activity_id: 5, custom_activity_name: null, day_number: 1, activity_time: '16:30:00', notes: 'Lagoon kayaking before sunset' },
      { journal_id: 4, activity_id: 2, custom_activity_name: null, day_number: 2, activity_time: '10:00:00', notes: 'Reef wall dive with sea fans' },
      { journal_id: 5, activity_id: 2, custom_activity_name: null, day_number: 1, activity_time: '11:00:00', notes: 'Manta drift dive' },
      { journal_id: 6, activity_id: 1, custom_activity_name: null, day_number: 1, activity_time: '08:30:00', notes: 'Turtle snorkeling route' },
      { journal_id: 7, activity_id: 6, custom_activity_name: null, day_number: 2, activity_time: '13:00:00', notes: 'Coral photography session' },
      { journal_id: 8, activity_id: 3, custom_activity_name: null, day_number: 1, activity_time: '09:30:00', notes: 'Lagoon island hopping' }
    ])

    await insertIfMissing(connection, 'journal_sightings', [
      'journal_id',
      'species_id',
      'custom_species_name',
      'quantity',
      'notes'
    ], [
      'journal_id',
      'species_id',
      'custom_species_name',
      'quantity',
      'notes'
    ], [
      { journal_id: 1, species_id: 1, custom_species_name: null, quantity: 3, notes: 'Spotted near shallow coral reef' },
      { journal_id: 1, species_id: 7, custom_species_name: null, quantity: 12, notes: 'Large schools swimming together' },
      { journal_id: 1, species_id: 11, custom_species_name: null, quantity: 1, notes: 'A hawksbill turtle near coral rubble' },
      { journal_id: 2, species_id: 12, custom_species_name: null, quantity: 80, notes: 'Barracuda school near the wall' },
      { journal_id: 2, species_id: 5, custom_species_name: null, quantity: 6, notes: 'Several reef sharks circling dive area' },
      { journal_id: 2, species_id: 19, custom_species_name: null, quantity: 1, notes: 'Large wrasse passing the reef slope' },
      { journal_id: 3, species_id: 4, custom_species_name: null, quantity: 2, notes: 'Manta rays near cleaning station' },
      { journal_id: 3, species_id: 2, custom_species_name: null, quantity: 1, notes: 'Whale shark seen from boat' },
      { journal_id: 4, species_id: 16, custom_species_name: null, quantity: 8, notes: 'Broad table coral colonies' },
      { journal_id: 4, species_id: 24, custom_species_name: null, quantity: 6, notes: 'Sea fans along current-swept wall' },
      { journal_id: 4, species_id: 21, custom_species_name: null, quantity: 3, notes: 'Grey reef sharks at deeper edge' },
      { journal_id: 5, species_id: 4, custom_species_name: null, quantity: 4, notes: 'Mantas during drift dive' },
      { journal_id: 5, species_id: 17, custom_species_name: null, quantity: 2, notes: 'Eagle rays gliding over sand' },
      { journal_id: 6, species_id: 1, custom_species_name: null, quantity: 2, notes: 'Turtles grazing in the morning' },
      { journal_id: 6, species_id: 3, custom_species_name: null, quantity: 5, notes: 'Clownfish tucked into anemones' },
      { journal_id: 7, species_id: 3, custom_species_name: null, quantity: 9, notes: 'Clownfish and anemone clusters' },
      { journal_id: 7, species_id: 14, custom_species_name: null, quantity: 4, notes: 'Giant clams in shallow reef patches' },
      { journal_id: 7, species_id: 22, custom_species_name: null, quantity: 18, notes: 'Butterflyfish pairs around coral heads' },
      { journal_id: 8, species_id: 2, custom_species_name: null, quantity: 1, notes: 'Possible whale shark sighting during boat transfer' },
      { journal_id: 8, species_id: 20, custom_species_name: null, quantity: 1, notes: 'Octopus hiding near rocks' }
    ])

    await insertIfMissing(connection, 'journal_media', [
      'journal_id',
      'species_id',
      'activity_id',
      'media_url',
      'media_type',
      'caption',
      'display_order'
    ], [
      'journal_id',
      'species_id',
      'activity_id',
      'media_url',
      'media_type',
      'caption',
      'display_order'
    ], [
      { journal_id: 1, species_id: 1, activity_id: 1, media_url: seedImage('journals', 'redang-turtle.jpg'), media_type: 'photo', caption: 'Sea turtle swimming beside coral reef', display_order: 1 },
      { journal_id: 1, species_id: null, activity_id: 5, media_url: seedImage('journals', 'redang-kayak.jpg'), media_type: 'photo', caption: 'Sunset kayaking view', display_order: 2 },
      { journal_id: 2, species_id: 12, activity_id: 2, media_url: seedImage('journals', 'sipadan-barracuda.jpg'), media_type: 'photo', caption: 'Barracuda school during dive', display_order: 1 },
      { journal_id: 2, species_id: 5, activity_id: 6, media_url: seedImage('journals', 'sipadan-reef-shark.jpg'), media_type: 'photo', caption: 'Reef shark encounter', display_order: 2 },
      { journal_id: 3, species_id: 4, activity_id: 5, media_url: seedImage('journals', 'maldives-manta.jpg'), media_type: 'photo', caption: 'Manta ray near lagoon channel', display_order: 1 },
      { journal_id: 4, species_id: 24, activity_id: 2, media_url: seedImage('journals', 'raja-ampat-seafan.jpg'), media_type: 'photo', caption: 'Sea fan coral on reef wall', display_order: 1 },
      { journal_id: 5, species_id: 4, activity_id: 2, media_url: seedImage('journals', 'komodo-manta.jpg'), media_type: 'photo', caption: 'Manta ray drift dive', display_order: 1 },
      { journal_id: 6, species_id: 1, activity_id: 1, media_url: seedImage('journals', 'perhentian-turtle.jpg'), media_type: 'photo', caption: 'Morning turtle route', display_order: 1 },
      { journal_id: 7, species_id: 14, activity_id: 6, media_url: seedImage('journals', 'great-barrier-clam.jpg'), media_type: 'photo', caption: 'Giant clam in clear water', display_order: 1 },
      { journal_id: 8, species_id: null, activity_id: 3, media_url: seedImage('journals', 'palawan-lagoon.jpg'), media_type: 'photo', caption: 'Island hopping through limestone lagoon', display_order: 1 }
    ])

    await insertIfMissing(connection, 'comments', [
      'user_id',
      'journal_id',
      'content'
    ], [
      'user_id',
      'journal_id',
      'content'
    ], [
      { user_id: 2, journal_id: 1, content: 'This looks amazing!' },
      { user_id: 1, journal_id: 2, content: 'Adding Sipadan to my bucket list!' },
      { user_id: 3, journal_id: 4, content: 'The reef wall notes are so useful.' },
      { user_id: 1, journal_id: 7, content: 'Great Barrier Reef is definitely on my list now.' }
    ])

    await insertIgnore(connection, 'likes', [
      'user_id',
      'journal_id'
    ], [
      { user_id: 1, journal_id: 2 },
      { user_id: 2, journal_id: 1 },
      { user_id: 3, journal_id: 1 },
      { user_id: 1, journal_id: 4 },
      { user_id: 2, journal_id: 7 }
    ])

    console.log('Seed data inserted')
  } catch (error) {
    console.error(error)
  }
}

module.exports = seedDatabase
