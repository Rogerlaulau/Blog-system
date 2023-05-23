# A Blog system with NodeJS, GraphQL, SQLite

## steps on how to start the service with Docker

```
Build docker image
$ docker build . -t rogerlau/blog

Check image
$ docker images

Run image
$ docker run -p 4000:4000 -d rogerlau/blog

Get container ID
$ docker ps

Open your Postman:
1. Go to Postman and create a tab set a request type with GraphQL
2. Enter request url: http://localhost:4000/graphql
3. Select type "Bearer Token" of a user named roger under Authorization with the following token (you need a token to sign up for a new user):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjc4LCJpYXQiOjE2ODQ4NjM3MTF9.FfG7tIIVlVbU3oW9g8gPxYfoWAGs3KsqG4ee15oxcAc

4. Select Query and refresh the shema
5. Test with Query, Mutation of GrapQL API


To kill container
$ docker kill <container id>
```


## About the preset database
Note:
1. 109 blog posts, 7 users
2. only 2 users/ authors published blog posts:

First User:

username: roger

password: password

token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjc4LCJpYXQiOjE2ODQ4NjM3MTF9.FfG7tIIVlVbU3oW9g8gPxYfoWAGs3KsqG4ee15oxcAc

blog id: 1, 2, 3

----------------------

Second User:

username: lau

password: password

token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUxNiwiaWF0IjoxNjg0ODY0MDkwfQ.6OVBLWw0iH9t3D-FBgZVeXcs9Bp1rJQMEhacq4YVYe0

blog id: 4



## Features:
1. JWT authorization is required to view / midify data
2. users can only edit, delete their own blog posts
3. A query API of users listing is not required, but remain here just for demonstration / testing
