const graphql = require("graphql");
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const saltRounds = 5;


//create a database if no exists
const database = new sqlite3.Database("./roger-blog.db");

//create tables to insert post, user, 
const initializeTables = () => {    
    const initializeUsers = `
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username text,
        email text,
        password text,
        created_at text,
        updated_at text
        )`;

    const initializePosts = `
        CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY,
        title text,
        content text,
        created_at text,
        updated_at text,
        author_id INTEGER,
        FOREIGN KEY (author_id) REFERENCES users (id)
    )`;
    
    database.run(initializeUsers);
    database.run(initializePosts);
}


//call function to init the post, postComment, user, role tables
initializeTables();

const AuthorType = new graphql.GraphQLObjectType({
    name: "Author",
    fields:{
        id: {type: graphql.GraphQLInt},
        username: {type: graphql.GraphQLString},
        email: {type: graphql.GraphQLString},
        created_at: { type: graphql.GraphQLString },
        updated_at: { type: graphql.GraphQLString },
    }
})

//create graphql post object
const PostType = new graphql.GraphQLObjectType({
    name: "Post",
    fields: {
        id: { type: graphql.GraphQLInt },
        title: { type: graphql.GraphQLString },
        content: { type: graphql.GraphQLString },
        author_id: { type: graphql.GraphQLInt },
        created_at: { type: graphql.GraphQLString },
        updated_at: { type: graphql.GraphQLString},
        author: {
            type: AuthorType,
            resolve: (post) => {
                return new Promise((resolve, reject) => {
                    database.get("SELECT * FROM Users WHERE id = (?);", [post.author_id], function(err, row){
                        if(err){
                            reject(null);
                        }
                        resolve(row);
                    });
                });
            }
        }
    }
});


//create graphql user object
const UserType = new graphql.GraphQLObjectType({
    name: "User",
    fields: {
        id: { type: graphql.GraphQLInt },
        username: { type: graphql.GraphQLString },
        email: { type: graphql.GraphQLString },
        //password: { type: graphql.GraphQLString }, //password should not be displayed
        created_at: { type: graphql.GraphQLString },
        updated_at: { type: graphql.GraphQLString },
        post:{
            type: graphql.GraphQLList(PostType),
            resolve: (user) => {
                return new Promise((resolve, reject) => {
                    database.all("SELECT * FROM Posts WHERE author_id = (?);", [user.id], function(err, row){
                        if(err){
                            reject(null);
                        }
                        resolve(row);
                    })
                })
            }
        }
    }
});

// create a graphql query to select all and by id
var queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        // query to select all users
        Users: {
            type: graphql.GraphQLList(UserType),
            resolve: (root, args, context, info) => {
                return new Promise((resolve, reject) => {
                    database.all("SELECT * FROM Users;", function(err, rows){
                        if (err){
                            reject([]);
                        }
                        resolve(rows);
                    });
                });
            }
        },

        // query to select a user by id
        User:{
            type: UserType,
            args:{
                id:{
                    type: new graphql.GraphQLNonNull(graphql.GraphQLID)
                }               
            },
            resolve: (root, {id}, context, info) => {
                return new Promise((resolve, reject) => {
                    database.all("SELECT * FROM Users WHERE id = (?);",[id], function(err, rows) {                           
                        if(err){
                            reject(null);
                        }
                        resolve(rows[0]);
                    });
                });
            }
        },

        //first query to select all
        Posts: {
            type: graphql.GraphQLList(PostType),
            resolve: (root, args, context, info) => {
                return new Promise((resolve, reject) => {
                    // raw SQLite query to select from table
                    database.all("SELECT * FROM Posts;", function(err, rows) {  
                        if(err){
                            reject([]);
                        }
                        resolve(rows);
                    });
                });
            }
        },
        //second query to select by id
        Post:{
            type: PostType,
            args:{
                id:{
                    type: new graphql.GraphQLNonNull(graphql.GraphQLID)
                }               
            },
            resolve: (root, {id}, context, info) => {
                return new Promise((resolve, reject) => {             
                    database.all("SELECT * FROM Posts WHERE id = (?);",[id], function(err, rows) {                           
                        if(err){
                            reject(null);
                        }
                        resolve(rows[0]);
                    });
                });
            }
        }
    }
});
//mutation type is a type of object to modify data (INSERT,DELETE,UPDATE)
var mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: {
      //mutation for create
      createPost: {
        //type of object to return after create in SQLite
        type: PostType,
        //argument of mutation creactePost to get from request
        args: {
          title: {
            type: new graphql.GraphQLNonNull(graphql.GraphQLString)
          },
          content:{
              type: new graphql.GraphQLNonNull(graphql.GraphQLString)
          },
          author_id:{
            type: new graphql.GraphQLNonNull(graphql.GraphQLInt)
          },
        },
        resolve: (root, {title, content, author_id}) => {
            return new Promise((resolve, reject) => {
                const created_at = updated_at = new Date().toISOString();
                //raw SQLite to insert a new post in post table
                database.run('INSERT INTO Posts (title, content, author_id, created_at, updated_at) VALUES (?,?,?,?,?);', [title, content, author_id, created_at, updated_at], (err) => {
                    if(err) {
                        reject(null);
                    }
                    database.get("SELECT last_insert_rowid() as id", (err, row) => {
                        resolve({
                            id: row["id"],
                            title: title,
                            content: content,
                            author_id: author_id,
                            created_at:created_at,
                            updated_at:updated_at
                        });
                    });
                });
            })
        }
      },
      //mutation for update
      updatePost: {
        //type of object to return afater update in SQLite
        type: graphql.GraphQLString,
        //argument of mutation createPost to get from request
        args:{
            id:{
                type: new graphql.GraphQLNonNull(graphql.GraphQLID)
            },
            title: {
                type: new graphql.GraphQLNonNull(graphql.GraphQLString)
            },
            content:{
                  type: new graphql.GraphQLNonNull(graphql.GraphQLString)
            },
            author_id:{
                type: new graphql.GraphQLNonNull(graphql.GraphQLInt)
            },            
        },
        resolve: (root, {id, title, content, author_id}) => {
            const updated_at = new Date().toISOString();
            return new Promise((resolve, reject) => {
                //raw SQLite to update a post in post table
                database.run('UPDATE Posts SET title = (?), content = (?), author_id = (?), updated_at = (?) WHERE id = (?);', [title, content, author_id, updated_at, id], (err) => {
                    if(err) {
                        reject(err);
                    }
                    resolve(`Post #${id} updated`);
                });
            })
        }
      },
      //mutation for update
      deletePost: {
         //type of object resturn after delete in SQLite
        type: graphql.GraphQLString,
        args:{
            id:{
                type: new graphql.GraphQLNonNull(graphql.GraphQLID)
            }               
        },
        resolve: (root, {id}) => {
            return new Promise((resolve, reject) => {
                //raw query to delete from post table by id
                database.run('DELETE from Posts WHERE id =(?);', [id], (err) => {
                    if(err) {
                        reject(err);
                    }
                    resolve(`Post #${id} deleted`);                    
                });
            })
        }
      },

      // ========================= User=========================
        //mutation for create
        createUser: {
            //type of object to return after create in SQLite
            type: UserType,
            //argument of mutation createUser to get from request
            args: {
                username: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
                email:{
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
                password:{
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                }
            },
            resolve: (root, {username, email, password}) => {
                return new Promise((resolve, reject) => {
                    // set the server time for create, update
                    const created_at = updated_at = new Date().toISOString();

                    // hash password before persisting to DB
                    bcrypt.hash(password, saltRounds, function(err, hash) {
                        //raw SQLite to insert a new user in user table
                        database.run('INSERT INTO Users (username, email, password, created_at, updated_at) VALUES (?,?,?,?,?);', [username, email, hash, created_at, updated_at], (err) => {
                            if(err) {
                                reject(null);
                            }
                            database.get("SELECT last_insert_rowid() as id", (err, row) => {
                                resolve({
                                    id: row["id"],
                                    username: username,
                                    email: email,
                                    password: hash,
                                    created_at: created_at,
                                    updated_at: updated_at
                                });
                            });
                        });
                    });
                    
                })
            }
        },
    }
});

//define schema with post object, queries, and mutation 
const schema = new graphql.GraphQLSchema({
    query: queryType,
    mutation: mutationType 
});

//export schema to use on index.js
module.exports = {
    schema
}