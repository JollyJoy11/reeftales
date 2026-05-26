const mysql = require('mysql2/promise');
require('dotenv').config();
const seedDatabase = require('./seedDatabase');

async function initializeDatabase() {
	try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // create database
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}
				CHARACTER SET utf8mb4
				COLLATE utf8mb4_unicode_ci
    `);

    // use database
    await connection.query(`
      USE ${process.env.DB_NAME}
    `);

		await connection.query(`
			SET NAMES utf8mb4
		`);

		async function run(sql) {
			await connection.query(sql);
		}

		// USERS
    await run(`
    	CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_image TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
		`);

		// ISLANDS
		await run(`
    	CREATE TABLE IF NOT EXISTS islands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(150),
        country VARCHAR(100),
        continent VARCHAR(100),
        description TEXT,
        cover_image LONGTEXT,
        best_visit_time VARCHAR(100),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
		`);

		// ACTIVITIES
		await run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
		`);

		// ISLAND_ACTIVITIES
		await run(`
      CREATE TABLE IF NOT EXISTS island_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        island_id INT NOT NULL,
        activity_id INT NOT NULL,

        FOREIGN KEY (island_id)
          REFERENCES islands(id)
          ON DELETE CASCADE,

        FOREIGN KEY (activity_id)
          REFERENCES activities(id)
          ON DELETE CASCADE,

        UNIQUE(island_id, activity_id)
    )
		`);

		// JOURNALS
    await run(`
      CREATE TABLE IF NOT EXISTS journals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        island_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        content LONGTEXT,
        cover_image LONGTEXT,
        start_date DATE,
        end_date DATE,

        mood ENUM(
          'peaceful',
          'excited',
          'adventurous',
          'relaxed',
          'amazed',
          'tired'
        ) DEFAULT 'peaceful',

        visibility ENUM('public', 'private') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        FOREIGN KEY (island_id)
          REFERENCES islands(id)
          ON DELETE CASCADE
      )
    `)

		// SPECIES
		await run(`
      CREATE TABLE IF NOT EXISTS species (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,

        category ENUM(
					'fish',
					'coral',
					'turtle',
					'shark',
					'ray',
					'jellyfish',
					'other'
        ) NOT NULL,

        scientific_name VARCHAR(150),
        conservation_status VARCHAR(100),
        habitats TEXT,
        min_depth INT,
        max_depth INT,
        description TEXT,
        image_url TEXT,
        tags TEXT,
				api_source VARCHAR(100),
				external_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
		`);

		// JOURNAL_SIGHTINGS
		await run(`
      CREATE TABLE IF NOT EXISTS journal_sightings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        journal_id INT NOT NULL,
        species_id INT NULL,
        custom_species_name VARCHAR(150),
        quantity INT DEFAULT 1,
        notes TEXT,

        FOREIGN KEY (journal_id)
          REFERENCES journals(id)
          ON DELETE CASCADE,

        FOREIGN KEY (species_id)
          REFERENCES species(id)
          ON DELETE SET NULL
    )
    `)

		// JOURNAL_ACTIVITIES
		await run(`
      CREATE TABLE IF NOT EXISTS journal_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        journal_id INT NOT NULL,
        activity_id INT NULL,
        custom_activity_name VARCHAR(150),
        day_number INT,
        activity_time TIME,
        notes TEXT,

        FOREIGN KEY (journal_id)
          REFERENCES journals(id)
          ON DELETE CASCADE,

        FOREIGN KEY (activity_id)
          REFERENCES activities(id)
          ON DELETE SET NULL
    )
    `)

		// JOURNAL MEDIA
		await run(`
      CREATE TABLE IF NOT EXISTS journal_media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        journal_id INT NOT NULL,
        species_id INT NULL,
        activity_id INT NULL,
        media_url LONGTEXT NOT NULL,
        media_type ENUM('photo', 'video') NOT NULL,
        caption TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (journal_id)
          REFERENCES journals(id)
          ON DELETE CASCADE,

        FOREIGN KEY (species_id)
          REFERENCES species(id)
          ON DELETE SET NULL,

        FOREIGN KEY (activity_id)
          REFERENCES activities(id)
          ON DELETE SET NULL
    )
    `)

		// COMMENTS
		await run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        journal_id INT NOT NULL,
        content TEXT NOT NULL,
				parent_comment_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
					REFERENCES users(id)
					ON DELETE CASCADE,

        FOREIGN KEY (journal_id)
					REFERENCES journals(id)
					ON DELETE CASCADE,

				FOREIGN KEY (parent_comment_id)
					REFERENCES comments(id)
					ON DELETE CASCADE
    )
		`);

		// LIKES
		await run(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        journal_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
					REFERENCES users(id)
					ON DELETE CASCADE,

        FOREIGN KEY (journal_id)
					REFERENCES journals(id)
					ON DELETE CASCADE,

        UNIQUE(user_id, journal_id)
    )
		`);

    // SAVED_JOURNALS
    await run(`
      CREATE TABLE IF NOT EXISTS saved_journals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        journal_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE,

        FOREIGN KEY (journal_id) 
          REFERENCES journals(id) 
          ON DELETE CASCADE,

        UNIQUE(user_id, journal_id)
    )
    `)

		// SAVED_ISLANDS
		await run(`
      CREATE TABLE IF NOT EXISTS saved_islands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        island_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
					REFERENCES users(id)
					ON DELETE CASCADE,

        FOREIGN KEY (island_id)
					REFERENCES islands(id)
					ON DELETE CASCADE,

        UNIQUE(user_id, island_id)
    )
		`);

		// ITINERARIES
		await run(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        island_id INT,
        start_date DATE,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
					REFERENCES users(id)
					ON DELETE CASCADE,

        FOREIGN KEY (island_id)
					REFERENCES islands(id)
					ON DELETE SET NULL
    )
		`);

		// ITINERARY_ACTIVITIES
		await run(`
      CREATE TABLE IF NOT EXISTS itinerary_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        itinerary_id INT NOT NULL,
        activity_id INT NOT NULL,
        day_number INT NOT NULL,
        activity_time TIME,
        notes TEXT,

        FOREIGN KEY (itinerary_id)
					REFERENCES itineraries(id)
					ON DELETE CASCADE,

        FOREIGN KEY (activity_id)
					REFERENCES activities(id)
					ON DELETE CASCADE
    )
    `);

    console.log('Database initialized');

		// run seeder
		await seedDatabase(connection);

    await connection.end();

  } catch (error) {
    console.error(error);
  }
}

module.exports = initializeDatabase;
