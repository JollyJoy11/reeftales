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
        longitude,
        marine_latitude,
        marine_longitude
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
        73.2207,
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
        -151.7415,
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
        -155.5828,
        19.6399,
        -156.0456
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
        118.6287,
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
        103.0333,
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
        cover_image,
        start_date,
        end_date,
        mood,
        visibility
      )
      VALUES
      (
        1,
        1,
        5,
        'My Magical Redang Adventure',
        'Spent four incredible days snorkeling around Redang Island. The coral gardens were vibrant and I even spotted turtles near the shallow reef.',
        '/images/journal-redang.jpg',
        '2025-06-15',
        '2025-06-18',
        'excited',
        'public'
      ),

      (
        2,
        2,
        4,
        'Diving Through Sipadan',
        'One of the best underwater experiences I have ever had. Huge schools of barracudas and reef sharks surrounded the dive site.',
        '/images/journal-sipadan.jpg',
        '2025-05-20',
        '2025-05-24',
        'amazed',
        'public'
      ),

      (
        3,
        1,
        1,
        'Peaceful Evenings in Maldives',
        'Relaxed by the crystal-clear waters and kayaked through the lagoon during sunset.',
        '/images/journal-maldives.jpg',
        '2025-04-08',
        '2025-04-12',
        'relaxed',
        'public'
      )
    `);

    // ---------------- JOURNAL ACTIVITIES ----------------
    await connection.query(`
      INSERT INTO journal_activities
      (
        journal_id,
        activity_id,
        custom_activity_name,
        day_number,
        activity_time,
        notes
      )
      SELECT
        seeded.journal_id,
        seeded.activity_id,
        seeded.custom_activity_name,
        seeded.day_number,
        seeded.activity_time,
        seeded.notes
      FROM (
        SELECT 1 AS journal_id, 1 AS activity_id, NULL AS custom_activity_name, 1 AS day_number, '09:00:00' AS activity_time, 'Morning snorkeling around coral reef' AS notes
        UNION ALL
        SELECT 1, 5, NULL, 2, '17:30:00', 'Sunset kayaking session'
        UNION ALL
        SELECT 2, 2, NULL, 1, '08:00:00', 'Deep dive near Barracuda Point'
        UNION ALL
        SELECT 2, NULL, 'Underwater Photography', 2, '14:00:00', 'Captured reef shark footage'
      ) AS seeded
      WHERE NOT EXISTS (
        SELECT 1
        FROM journal_activities existing
        WHERE existing.journal_id = seeded.journal_id
          AND existing.activity_id <=> seeded.activity_id
          AND existing.custom_activity_name <=> seeded.custom_activity_name
          AND existing.day_number <=> seeded.day_number
          AND existing.activity_time <=> seeded.activity_time
          AND existing.notes <=> seeded.notes
      )
    `);

    // ---------------- JOURNAL SIGHTINGS ----------------
    await connection.query(`
      INSERT INTO journal_sightings
      (
        journal_id,
        species_id,
        custom_species_name,
        quantity,
        notes
      )
      SELECT
        seeded.journal_id,
        seeded.species_id,
        seeded.custom_species_name,
        seeded.quantity,
        seeded.notes
      FROM (
        SELECT 1 AS journal_id, 1 AS species_id, NULL AS custom_species_name, 3 AS quantity, 'Spotted near shallow coral reef' AS notes
        UNION ALL
        SELECT 1, 7, NULL, 12, 'Large schools swimming together'
        UNION ALL
        SELECT 2, 2, NULL, 2, 'Massive whale sharks seen during dive'
        UNION ALL
        SELECT 2, 5, NULL, 6, 'Several reef sharks circling dive area'
        UNION ALL
        SELECT 3, NULL, 'Dolphin Pod', 8, 'Seen during evening boat ride'
      ) AS seeded
      WHERE NOT EXISTS (
        SELECT 1
        FROM journal_sightings existing
        WHERE existing.journal_id = seeded.journal_id
          AND existing.species_id <=> seeded.species_id
          AND existing.custom_species_name <=> seeded.custom_species_name
          AND existing.quantity <=> seeded.quantity
          AND existing.notes <=> seeded.notes
      )
    `);

    // ---------------- JOURNAL MEDIA ----------------
    await connection.query(`
      INSERT INTO journal_media
      (
        journal_id,
        species_id,
        activity_id,
        media_url,
        media_type,
        caption,
        display_order
      )
      SELECT
        seeded.journal_id,
        seeded.species_id,
        seeded.activity_id,
        seeded.media_url,
        seeded.media_type,
        seeded.caption,
        seeded.display_order
      FROM (
        SELECT 1 AS journal_id, 1 AS species_id, 1 AS activity_id, '/images/journal/redang-turtle.jpg' AS media_url, 'photo' AS media_type, 'Sea turtle swimming beside coral reef' AS caption, 1 AS display_order
        UNION ALL
        SELECT 1, NULL, 5, '/images/journal/redang-kayak.jpg', 'photo', 'Sunset kayaking view', 2
        UNION ALL
        SELECT 2, 2, 2, '/images/journal/sipadan-whaleshark.jpg', 'photo', 'Whale shark encounter during dive', 1
        UNION ALL
        SELECT 3, NULL, NULL, '/images/journal/maldives-lagoon.jpg', 'photo', 'Peaceful lagoon at sunset', 1
      ) AS seeded
      WHERE NOT EXISTS (
        SELECT 1
        FROM journal_media existing
        WHERE existing.journal_id = seeded.journal_id
          AND existing.species_id <=> seeded.species_id
          AND existing.activity_id <=> seeded.activity_id
          AND existing.media_url = seeded.media_url
          AND existing.media_type = seeded.media_type
          AND existing.caption <=> seeded.caption
          AND existing.display_order <=> seeded.display_order
      )
    `);

    // ---------------- COMMENTS ----------------
    await connection.query(`
      INSERT INTO comments
      (
        user_id,
        journal_id,
        content
      )
      SELECT
        seeded.user_id,
        seeded.journal_id,
        seeded.content
      FROM (
        SELECT 2 AS user_id, 1 AS journal_id, 'This looks amazing!' AS content
        UNION ALL
        SELECT 1, 2, 'Adding Sipadan to my bucket list!'
      ) AS seeded
      WHERE NOT EXISTS (
        SELECT 1
        FROM comments existing
        WHERE existing.user_id = seeded.user_id
          AND existing.journal_id = seeded.journal_id
          AND existing.content = seeded.content
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
