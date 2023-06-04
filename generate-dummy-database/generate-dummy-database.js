import sqlite3 from 'sqlite3';
import axios from 'axios';

//create a database if no exists
const database = new sqlite3.Database("./myblog.db");

// Create the necessary database tables
database.serialize(() => {
    database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
  
    database.run(`
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



var url = "https://dummyjson.com/posts/";

function getRandomInt(min = 1, max = 6) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
// console.log(getRandomInt());


async function setPost(postId = 1) {
    try {
      const post_url = url + postId 
      console.log(`post_url: ${post_url}`)
      const response = await axios.get(post_url);
      const post = response.data;
    //   console.log(post);

      const author_id = getRandomInt();
      const created_at = new Date().toISOString();
      const updated_at = new Date().toISOString();
      database.run('INSERT INTO blog_posts (title, content, authorId, createdAt, updatedAt) VALUES (?,?,?,?,?);', [post.title, post.body, author_id, created_at, updated_at], (err) => {
          if(err) {
              reject(null);
          }
      });
    } catch (error) {
      console.error(error);
    }
}


async function setUser(){
    const created_at = new Date().toISOString();
    const updated_at = new Date().toISOString();
    database.run('INSERT INTO Users (username, email, password, createdAt, updatedAt) VALUES (?,?,?,?,?);', ["roger", "ro@lau.com", "123qwerty", created_at, updated_at], (err) => {
        if(err) {
            reject(null);
        }
    });

}



for (let i = 1; i < 110; i++) {
    await setPost(i)
}

// await setUser();






