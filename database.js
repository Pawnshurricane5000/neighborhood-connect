const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

class Database {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.db = null;
    this.pool = null;
    
    if (this.isProduction) {
      // PostgreSQL for production
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      // SQLite for development
      this.db = new sqlite3.Database('./messaging.db');
    }
  }

  // Initialize database tables
  async initialize() {
    if (this.isProduction) {
      return this.initializePostgreSQL();
    } else {
      return this.initializeSQLite();
    }
  }

  async initializePostgreSQL() {
    const client = await this.pool.connect();
    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(20) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name VARCHAR(50) NOT NULL,
          city VARCHAR(50) NOT NULL,
          email VARCHAR(255) NOT NULL,
          avatar VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create conversations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          conversation_id VARCHAR(255) UNIQUE NOT NULL,
          participant1 VARCHAR(20) NOT NULL,
          participant2 VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id VARCHAR(255) NOT NULL,
          sender VARCHAR(20) NOT NULL,
          message_text TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_read INTEGER DEFAULT 0
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_participants 
        ON conversations(participant1, participant2)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_conversation 
        ON messages(conversation_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_sender 
        ON messages(sender)
      `);

      console.log('✅ PostgreSQL database initialized');
    } catch (err) {
      console.error('Error initializing PostgreSQL:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  initializeSQLite() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users table
        this.db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          city TEXT NOT NULL,
          email TEXT NOT NULL,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Check if we need to migrate existing data
        this.db.get("PRAGMA table_info(users)", (err, rows) => {
          if (!err) {
            this.db.all("PRAGMA table_info(users)", (err, columns) => {
              if (!err) {
                const hasFullName = columns.some(col => col.name === 'full_name');
                const hasCity = columns.some(col => col.name === 'city');
                
                if (!hasFullName) {
                  this.db.run("ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT 'User'");
                  console.log('Added full_name column to users table');
                }
                
                if (!hasCity) {
                  this.db.run("ALTER TABLE users ADD COLUMN city TEXT DEFAULT 'Unknown'");
                  console.log('Added city column to users table');
                }
                
                // Update existing users to have default values
                this.db.run("UPDATE users SET full_name = username WHERE full_name IS NULL OR full_name = 'User'");
                this.db.run("UPDATE users SET city = 'Unknown' WHERE city IS NULL OR city = 'Unknown'");
              }
            });
          }
        });

        // Conversations table
        this.db.run(`CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT UNIQUE NOT NULL,
          participant1 TEXT NOT NULL,
          participant2 TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Messages table
        this.db.run(`CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          message_text TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_read INTEGER DEFAULT 0
        )`);

        // Create indexes for better performance
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1, participant2)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender)`);

        console.log('✅ SQLite database initialized');
        resolve();
      });
    });
  }

  // Query methods that work with both databases
  async query(sql, params = []) {
    if (this.isProduction) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }

  async get(sql, params = []) {
    if (this.isProduction) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.isProduction) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return { lastID: result.rows[0]?.id, changes: result.rowCount };
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }

  async close() {
    if (this.isProduction) {
      await this.pool.end();
    } else {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

module.exports = Database;
