<<<<<<< HEAD
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('./database');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdnjs.cloudflare.com", "https://apis.google.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://neighbor-connect-2b315.firebaseapp.com", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://accounts.google.com", "https://*.vercel.app", "https://*.netlify.app"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'neighborconnect-secret-key-2024';

// Database setup
const db = new Database();

// Initialize database tables
db.initialize().catch(console.error);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, fullName, city } = req.body;

    if (!username || !password || !email || !fullName || !city) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (fullName.length < 2 || fullName.length > 50) {
      return res.status(400).json({ error: 'Full name must be between 2 and 50 characters' });
    }

    if (city.length < 2 || city.length > 50) {
      return res.status(400).json({ error: 'City must be between 2 and 50 characters' });
    }

    // Check if username already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await db.get('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = username.substring(0, 2).toUpperCase();

    const result = await db.run(
      'INSERT INTO users (username, password_hash, full_name, city, email, avatar) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, hashedPassword, fullName, city, email, avatar]
    );

    // Generate JWT token
    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.lastID,
        username,
        fullName,
        city,
        avatar,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last seen
    await db.run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, full_name, city, avatar, email, created_at, last_seen FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all users (for starting conversations)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, full_name, city, avatar, last_seen FROM users WHERE id != $1 ORDER BY username', [req.user.id]);
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user conversations
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT c.*, 
             u.username as other_user, 
             u.full_name as other_full_name,
             u.city as other_city,
             u.avatar as other_avatar,
             m.message_text as last_message,
             m.timestamp as last_message_time,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND sender != $1 AND is_read = 0) as unread_count
      FROM conversations c
      JOIN users u ON (c.participant1 = $2 AND u.username = c.participant2) 
                     OR (c.participant2 = $3 AND u.username = c.participant1)
      LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.conversation_id 
        ORDER BY timestamp DESC LIMIT 1
      )
      WHERE c.participant1 = $4 OR c.participant2 = $5
      ORDER BY m.timestamp DESC NULLS LAST
    `;

    const conversations = await db.query(query, [
      req.user.username, 
      req.user.username, 
      req.user.username, 
      req.user.username, 
      req.user.username
    ]);
    res.json(conversations);
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get conversation messages
app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of this conversation
    const conversation = await db.get(
      'SELECT * FROM conversations WHERE conversation_id = $1 AND (participant1 = $2 OR participant2 = $3)', 
      [conversationId, req.user.username, req.user.username]
    );
    
    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Get messages
    const messages = await db.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC', 
      [conversationId]
    );
    res.json(messages);
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new conversation
app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { otherUsername } = req.body;

    if (!otherUsername) {
      return res.status(400).json({ error: 'Other username is required' });
    }

    if (otherUsername === req.user.username) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if other user exists
    const otherUser = await db.get('SELECT id FROM users WHERE username = $1', [otherUsername]);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if conversation already exists
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.run(
      'INSERT INTO conversations (conversation_id, participant1, participant2) VALUES ($1, $2, $3)', 
      [conversationId, req.user.username, otherUsername]
    );

    res.status(201).json({
      message: 'Conversation created successfully',
      conversationId,
      participants: [req.user.username, otherUsername]
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
app.post('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageText } = req.body;

    if (!messageText || messageText.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Verify user is part of this conversation
    const conversation = await db.get(
      'SELECT * FROM conversations WHERE conversation_id = $1 AND (participant1 = $2 OR participant2 = $3)', 
      [conversationId, req.user.username, req.user.username]
    );
    
    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Insert message
    const result = await db.run(
      'INSERT INTO messages (conversation_id, sender, message_text) VALUES ($1, $2, $3)', 
      [conversationId, req.user.username, messageText.trim()]
    );

    // Update conversation last message time
    await db.run(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = $1', 
      [conversationId]
    );

    // Emit to connected clients
    io.to(conversationId).emit('new_message', {
      id: result.lastID,
      conversation_id: conversationId,
      sender: req.user.username,
      message_text: messageText.trim(),
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.lastID
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
app.put('/api/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of this conversation
    const conversation = await db.get(
      'SELECT * FROM conversations WHERE conversation_id = $1 AND (participant1 = $2 OR participant2 = $3)', 
      [conversationId, req.user.username, req.user.username]
    );
    
    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Mark messages as read
    const result = await db.run(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = $1 AND sender != $2 AND is_read = 0', 
      [conversationId, req.user.username]
    );

    res.json({ message: 'Messages marked as read', updatedCount: result.changes });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User left conversation: ${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      username: data.username,
      conversationId: data.conversationId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.conversationId).emit('user_stopped_typing', {
      username: data.username,
      conversationId: data.conversationId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 NeighborConnect Messaging Server running on port ${PORT}`);
  console.log(`📱 Server is ready for real-time messaging!`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await db.close();
    console.log('✅ Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});
=======
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdnjs.cloudflare.com", "https://apis.google.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://neighbor-connect-2b315.firebaseapp.com", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://accounts.google.com", "https://*.vercel.app", "https://*.netlify.app"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'neighborconnect-secret-key-2024';

// Database setup
const db = new sqlite3.Database('./messaging.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
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
  db.get("PRAGMA table_info(users)", (err, rows) => {
    if (!err) {
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (!err) {
          const hasFullName = columns.some(col => col.name === 'full_name');
          const hasCity = columns.some(col => col.name === 'city');
          
          if (!hasFullName) {
            db.run("ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT 'User'");
            console.log('Added full_name column to users table');
          }
          
          if (!hasCity) {
            db.run("ALTER TABLE users ADD COLUMN city TEXT DEFAULT 'Unknown'");
            console.log('Added city column to users table');
          }
          
          // Update existing users to have default values
          db.run("UPDATE users SET full_name = username WHERE full_name IS NULL OR full_name = 'User'");
          db.run("UPDATE users SET city = 'Unknown' WHERE city IS NULL OR city = 'Unknown'");
        }
      });
    }
  });

  // Conversations table
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT UNIQUE NOT NULL,
    participant1 TEXT NOT NULL,
    participant2 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    message_text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  )`);

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1, participant2)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender)`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, fullName, city } = req.body;

    if (!username || !password || !email || !fullName || !city) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (fullName.length < 2 || fullName.length > 50) {
      return res.status(400).json({ error: 'Full name must be between 2 and 50 characters' });
    }

    if (city.length < 2 || city.length > 50) {
      return res.status(400).json({ error: 'City must be between 2 and 50 characters' });
    }

    // Check if username already exists
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Check if email already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, emailRow) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (emailRow) {
          return res.status(409).json({ error: 'Email already exists' });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar = username.substring(0, 2).toUpperCase();

        db.run('INSERT INTO users (username, password_hash, full_name, city, email, avatar) VALUES (?, ?, ?, ?, ?, ?)', 
          [username, hashedPassword, fullName, city, email, avatar], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          // Generate JWT token
          const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
          
          res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
              id: this.lastID,
              username,
              fullName,
              city,
              avatar,
              email
            }
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last seen
    db.run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        email: user.email
      }
    });
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, full_name, city, avatar, email, created_at, last_seen FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Get all users (for starting conversations)
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, full_name, city, avatar, last_seen FROM users WHERE id != ? ORDER BY username', 
    [req.user.id], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Get user conversations
app.get('/api/conversations', authenticateToken, (req, res) => {
  const query = `
    SELECT c.*, 
           u.username as other_user, 
           u.full_name as other_full_name,
           u.city as other_city,
           u.avatar as other_avatar,
           m.message_text as last_message,
           m.timestamp as last_message_time,
           (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND sender != ? AND is_read = 0) as unread_count
    FROM conversations c
    JOIN users u ON (c.participant1 = ? AND u.username = c.participant2) 
                   OR (c.participant2 = ? AND u.username = c.participant1)
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages 
      WHERE conversation_id = c.conversation_id 
      ORDER BY timestamp DESC LIMIT 1
    )
    WHERE c.participant1 = ? OR c.participant2 = ?
    ORDER BY m.timestamp DESC NULLS LAST
  `;

  db.all(query, [req.user.username, req.user.username, req.user.username, req.user.username, req.user.username], 
    (err, conversations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(conversations);
    });
});

// Get conversation messages
app.get('/api/conversations/:conversationId/messages', authenticateToken, (req, res) => {
  const { conversationId } = req.params;

  // Verify user is part of this conversation
  db.get('SELECT * FROM conversations WHERE conversation_id = ? AND (participant1 = ? OR participant2 = ?)', 
    [conversationId, req.user.username, req.user.username], (err, conversation) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Get messages
      db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', 
        [conversationId], (err, messages) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(messages);
        });
    });
});

// Create new conversation
app.post('/api/conversations', authenticateToken, (req, res) => {
  const { otherUsername } = req.body;

  if (!otherUsername) {
    return res.status(400).json({ error: 'Other username is required' });
  }

  if (otherUsername === req.user.username) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  // Check if other user exists
  db.get('SELECT id FROM users WHERE username = ?', [otherUsername], (err, otherUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if conversation already exists
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    db.run('INSERT INTO conversations (conversation_id, participant1, participant2) VALUES (?, ?, ?)', 
      [conversationId, req.user.username, otherUsername], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create conversation' });
        }

        res.status(201).json({
          message: 'Conversation created successfully',
          conversationId,
          participants: [req.user.username, otherUsername]
        });
      });
    });
});

// Send message
app.post('/api/conversations/:conversationId/messages', authenticateToken, (req, res) => {
  const { conversationId } = req.params;
  const { messageText } = req.body;

  if (!messageText || messageText.trim().length === 0) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // Verify user is part of this conversation
  db.get('SELECT * FROM conversations WHERE conversation_id = ? AND (participant1 = ? OR participant2 = ?)', 
    [conversationId, req.user.username, req.user.username], (err, conversation) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Insert message
      db.run('INSERT INTO messages (conversation_id, sender, message_text) VALUES (?, ?, ?)', 
        [conversationId, req.user.username, messageText.trim()], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send message' });
          }

          // Update conversation last message time
          db.run('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = ?', 
            [conversationId]);

          // Emit to connected clients
          io.to(conversationId).emit('new_message', {
            id: this.lastID,
            conversation_id: conversationId,
            sender: req.user.username,
            message_text: messageText.trim(),
            timestamp: new Date().toISOString()
          });

          res.status(201).json({
            message: 'Message sent successfully',
            messageId: this.lastID
          });
        });
    });
});

// Mark messages as read
app.put('/api/conversations/:conversationId/read', authenticateToken, (req, res) => {
  const { conversationId } = req.params;

  // Verify user is part of this conversation
  db.get('SELECT * FROM conversations WHERE conversation_id = ? AND (participant1 = ? OR participant2 = ?)', 
    [conversationId, req.user.username, req.user.username], (err, conversation) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!conversation) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Mark messages as read
      db.run('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender != ? AND is_read = 0', 
        [conversationId, req.user.username], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to mark messages as read' });
          }

          res.json({ message: 'Messages marked as read', updatedCount: this.changes });
        });
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User left conversation: ${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      username: data.username,
      conversationId: data.conversationId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.conversationId).emit('user_stopped_typing', {
      username: data.username,
      conversationId: data.conversationId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 NeighborConnect Messaging Server running on port ${PORT}`);
  console.log(`📱 Server is ready for real-time messaging!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});
>>>>>>> 3dc65e7cba26a703c63e38d82ccff2cfbce780e2
