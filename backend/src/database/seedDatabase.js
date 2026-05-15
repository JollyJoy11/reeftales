const bcrypt = require('bcrypt');

async function seedDatabase(connection) {
  try {
    // ---------------- USERS ----------------
    const hashedPassword =
      await bcrypt.hash('password123', 10);

    await connection.query(`
      INSERT IGNORE INTO users
      (id, username, email, password, bio)
      VALUES
      (
        1,
        'oceanlover',
        'ocean@example.com',
        '${hashedPassword}',
        'Diver exploring tropical islands 🌊'
      ),
      (
        2,
        'coralqueen',
        'coral@example.com',
        '${hashedPassword}',
        'Marine life enthusiast 🐠'
      )
    `);

    // ---------------- ISLANDS ----------------
    await connection.query(`
      INSERT IGNORE INTO islands
      (
        id,
        name,
        location,
        country,
        continent,
        description,
        best_visit_time,
        latitude,
        longitude
      )
      VALUES

      (
        1,
        'Maldives',
        'South Asia',
        'Maldives',
        'Asia',
        'Crystal clear waters and luxury islands',
        'November - April',
        3.2028,
        73.2207
      ),

      (
        2,
        'Bora Bora',
        'French Polynesia',
        'France',
        'Europe',
        'Famous turquoise lagoon destination',
        'May - October',
        -16.5004,
        -151.7415
      ),

      (
        3,
        'Hawaii',
        'Pacific Ocean',
        'USA',
        'North America',
        'Volcanic islands with rich marine life',
        'April - October',
        19.8968,
        -155.5828
      ),

      (
        4,
        'Sipadan Island',
        'Sabah',
        'Malaysia',
        'Asia',
        'World-famous scuba diving destination',
        'April - December',
        4.1148,
        118.6287
      ),

      (
        5,
        'Redang Island',
        'Terengganu',
        'Malaysia',
        'Asia',
        'Popular snorkeling paradise',
        'March - October',
        5.7833,
        103.0333
      )
    `);

    // ---------------- ACTIVITIES ----------------
    await connection.query(`
      INSERT IGNORE INTO activities
      (id, name, description, icon)
      VALUES
      (1, 'Snorkeling',
       'Explore coral reefs', 'water'),

      (2, 'Scuba Diving',
       'Dive deeper underwater', 'fish'),

      (3, 'Island Hopping',
       'Visit nearby islands', 'map'),

      (4, 'Sunset Watching',
       'Relax by the ocean', 'sun'),

      (5, 'Kayaking',
       'Paddle through lagoons', 'boat')
    `);

    await connection.query(`
      INSERT IGNORE INTO island_activities
      (island_id, activity_id)
      VALUES
      (1, 1),
      (1, 2),
      (2, 1),
      (2, 3),
      (3, 2),
      (3, 4),
      (4, 1),
      (4, 2),
      (5, 1),
      (5, 5)
    `);

    // ---------------- SPECIES ----------------
    await connection.query(`
      INSERT IGNORE INTO species
      (
        id,
        name,
        category,
        scientific_name,
        conservation_status,
        habitats,
        min_depth,
        max_depth,
        description,
        image_url,
        tags,
        api_source,
        external_id
      )
      VALUES
      (
        1,
        'Green Sea Turtle',
        'turtle',
        'Chelonia mydas',
        'Endangered',
        'Sipadan, Maldives, Fiji',
        1,
        30,
        'A gentle marine turtle commonly seen around coral reefs and seagrass beds.',
        '/images/species-turtle.jpg',
        'Herbivore,Friendly,Reef',
        'manual',
        NULL
      ),
      (
        2,
        'Whale Shark',
        'shark',
        'Rhincodon typus',
        'Vulnerable',
        'Maldives, Philippines, Ningaloo Reef',
        0,
        50,
        'The largest fish in the ocean, often seen in warm tropical waters.',
        '/images/species-whaleshark.jpg',
        'Gentle Giant,Pelagic,Filter Feeder',
        'manual',
        NULL
      ),
      (
        3,
        'Clownfish',
        'fish',
        'Amphiprioninae',
        'Least Concern',
        'Great Barrier Reef, Maldives',
        1,
        15,
        'A small reef fish commonly found living among sea anemones.',
        '/images/species-clownfish.jpg',
        'Reef,Small Fish,Anemone',
        'manual',
        NULL
      ),
      (
        4,
        'Manta Ray',
        'ray',
        'Mobula alfredi',
        'Vulnerable',
        'Maldives, Raja Ampat, Komodo',
        5,
        40,
        'A graceful ray often seen gliding through tropical reefs and cleaning stations.',
        '/images/species-mantaray.jpg',
        'Gentle,Reef,Open Water',
        'manual',
        NULL
      ),
      (
        5,
        'Reef Shark',
        'shark',
        'Carcharhinus melanopterus',
        'Vulnerable',
        'Sipadan, Maldives, Great Barrier Reef',
        1,
        75,
        'A reef-associated shark commonly spotted around coral slopes and lagoon edges.',
        '/images/species-reefshark.jpg',
        'Predator,Reef,Fast Swimmer',
        'manual',
        NULL
      ),
      (
        6,
        'Blue Tang',
        'fish',
        'Paracanthurus hepatus',
        'Least Concern',
        'Great Barrier Reef, Fiji, Indonesia',
        2,
        40,
        'A bright blue reef fish known for its vivid colour and active swimming behaviour.',
        '/images/species-bluetang.jpg',
        'Reef,Colourful,Small Fish',
        'manual',
        NULL
      ),
      (
        7,
        'Parrotfish',
        'fish',
        'Scarus',
        'Least Concern',
        'Maldives, Redang, Great Barrier Reef',
        1,
        30,
        'A colourful reef fish that helps maintain coral reef health by grazing algae.',
        '/images/species-parrotfish.jpg',
        'Herbivore,Reef,Colourful',
        'manual',
        NULL
      ),
      (
        8,
        'Brain Coral',
        'coral',
        'Diploria labyrinthiformis',
        'Near Threatened',
        'Caribbean, Bahamas, Florida Keys',
        1,
        30,
        'A hard coral named for its maze-like surface pattern, often found in shallow reefs.',
        '/images/species-braincoral.jpg',
        'Coral,Reef Builder,Slow Growing',
        'manual',
        NULL
      ),
      (
        9,
        'Sea Anemone',
        'other',
        'Actiniaria',
        'Not Evaluated',
        'Great Barrier Reef, Maldives, Indonesia',
        1,
        25,
        'A soft-bodied marine animal often associated with clownfish and reef ecosystems.',
        '/images/species-anemone.jpg',
        'Reef,Symbiosis,Clownfish Habitat',
        'manual',
        NULL
      ),
      (
        10,
        'Moon Jellyfish',
        'jellyfish',
        'Aurelia aurita',
        'Not Evaluated',
        'Worldwide Coastal Waters',
        0,
        20,
        'A translucent jellyfish often seen drifting slowly in calm coastal waters.',
        '/images/species-jellyfish.jpg',
        'Drifter,Soft Body,Coastal',
        'manual',
        NULL
      )
    `)

    // ---------------- JOURNALS ----------------
    await connection.query(`
      INSERT IGNORE INTO journals
      (
        id,
        user_id,
        island_id,
        title,
        content,
        visit_date,
        mood,
        visibility
      )
      VALUES

      (
        1,
        1,
        5,
        'My Magical Redang Trip',
        'Saw crystal clear water and many fishes!',
        '2025-06-15',
        'excited',
        'public'
      ),

      (
        2,
        2,
        4,
        'Diving at Sipadan',
        'One of the best underwater experiences.',
        '2025-05-20',
        'amazed',
        'public'
      )
    `);

    // ---------------- JOURNAL SIGHTINGS ----------------
    await connection.query(`
      INSERT IGNORE INTO journal_sightings
      (
        journal_id,
        species_id,
        quantity,
        notes
      )
      VALUES
      (1,1,12,'Swimming near coral'),
      (1,3,5,'Beautiful reef area'),
      (2,2,2,'Saw near diving site')
    `);

    // ---------------- COMMENTS ----------------
    await connection.query(`
      INSERT IGNORE INTO comments
      (
        user_id,
        journal_id,
        content
      )
      VALUES
      (
        2,
        1,
        'This looks amazing!'
      ),

      (
        1,
        2,
        'Adding Sipadan to my bucket list!'
      )
    `);

    // ---------------- LIKES ----------------
    await connection.query(`
      INSERT IGNORE INTO likes
      (user_id, journal_id)
      VALUES
      (1,2),
      (2,1)
    `);

    console.log('Seed data inserted');
  }
  catch (error) {
    console.error(error);
  }
}

module.exports = seedDatabase;
