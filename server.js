// Required dependencies
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SQLite database initialization
// const db = new sqlite3.Database(':memory:'); // In-memory database for simplicity
const db = new sqlite3.Database('myblog.db'); // In-memory database for simplicity

// Define the GraphQL schema
const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
    createdAt: String!
    updatedAt: String!
  }

  type BlogPost {
    id: ID!
    title: String!
    content: String!
    authorId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    blogPosts: [BlogPost!]!
    blogPost(id: ID!): BlogPost
    users: [User!]!
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    createBlogPost(title: String!, content: String!): BlogPost
    updateBlogPost(id: ID!, title: String!, content: String!): BlogPost
    deleteBlogPost(id: ID!): Boolean
  }
`);

// Define resolver functions
const root = {
  // Resolver for fetching all blog posts
  blogPosts: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM blog_posts', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },

  // Resolver for fetching a blog post by ID
  blogPost: ({ id }) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM blog_posts WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },

  // Resolver for fetching all blog posts //TODO: JUST FOR DEV, to be removed as this is not in the requirement
  users: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },

  // Resolver for user signup
  signup: async ({ username, email, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Math.floor(Math.random() * 1000); // Replace with a proper ID generation mechanism
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    db.run(
      'INSERT INTO users (id, username, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, email, hashedPassword, createdAt, updatedAt]
    );
    const token = jwt.sign({ userId }, 'secret_key');
    return { token, user: { id: userId, username, createdAt, updatedAt } };

  },

  // Resolver for user login
  login: async ({ username, password }) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
        if (err || !row) {
          reject(new Error('Invalid username or password'));
          return;
        }
        const passwordMatch = await bcrypt.compare(password, row.password);
        if (!passwordMatch) {
          reject(new Error('Invalid username or password'));
          return;
        }
        const token = jwt.sign({ userId: row.id }, 'secret_key'); // Replace 'secret_key' with your own secret key
        resolve({ token, user: { id: row.id, username } });
      });
    });
  },

  // Resolver for creating a new blog post
  createBlogPost: ({ title, content }, { userId }) => {
    return new Promise((resolve, reject) => {
      const createdAt = new Date().toISOString();
      const updatedAt = createdAt;
      // const postId = Math.floor(Math.random() * 1000); // Replace with a proper ID generation mechanism
      // db.run(
      //   'INSERT INTO blog_posts (id, title, content, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      //   [postId, title, content, userId, createdAt, updatedAt]
      // );
      // return { id: postId, title, content, authorId: userId, createdAt, updatedAt  };
      db.run(
        'INSERT INTO blog_posts (title, content, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [title, content, userId, createdAt, updatedAt]
      );
      db.get("SELECT last_insert_rowid() as id", (err, row) => {
        resolve({ id: row["id"], title, content, authorId: userId, createdAt, updatedAt  });
      });
    })    
  },

  // Resolver for updating an existing blog post
  updateBlogPost: ({ id, title, content }, { userId }) => {
    return new Promise((resolve, reject) => {
      const updatedAt = new Date().toISOString();
      db.run(
        'UPDATE blog_posts SET title = ?, content = ?, updatedAt = ? WHERE id = ? AND authorId = ?',
        [title, content, updatedAt, id, userId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Blog post not found or unauthorized'));
            return;
          }
          resolve({ id, title, content, authorId: userId, updatedAt });
        }
      );
    });
  },

  // Resolver for deleting a blog post
  deleteBlogPost: ({ id }, { userId }) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM blog_posts WHERE id = ? AND authorId = ?', [id, userId], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  },
};

// Create the Express server
const app = express();

// Middleware for verifying JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.sendStatus(401);
    return;
  }
  jwt.verify(token, 'secret_key', (err, payload) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    req.userId = payload.userId;
    next();
  });
};

// Set up the GraphQL endpoint
app.use(
  '/graphql',
  authenticateToken,
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

// Start the server
const port = 4000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
});

// Create the necessary database tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      authorId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (authorId) REFERENCES users (id)
    )
  `);
  
});


