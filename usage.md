Build docker image
$ docker build . -t rogerlau/blog

Check image
$ docker images

Run image
$ docker run -p 4000:4000 -d rogerlau/blog

Get container ID
$ docker ps

To kill container
$ docker kill <container id>


Go to your browser:
http://localhost:4000/graphql



========================================
Testing:

# CREATE USER
mutation {
  createUser(username: "Roger Lau", email: "roger@lau.com", password: "123XYZ#abc") {
    username,
    email,
    created_at,
    updated_at
  }
}


# CREATE POST
mutation {
  createPost(title: "Toy Story", content: "Here are some of the main characters from the Toy Story franchise: Woody - The main protagonist and leader of the toys.Buzz Lightyear - A space ranger action figure who becomes one of Andy's favorite toys. Jessie - A spirited cowgirl doll and member of Woody's Roundup Gang.Mr. Potato Head - A sarcastic and funny potato-shaped toy with detachable body parts. Rex - A lovable but timid Tyrannosaurus rex toy. Hamm - A wise-cracking piggy bank and one of Andy's toys. Slinky Dog - A loyal and stretchy toy dog with a slinky body. Bo Peep - A porcelain figurine and love interest of Woody. Aliens - The cute, three-eyed extraterrestrial toys from Pizza Planet. Andy - The owner of the toys and their human friend. These are just a few of the beloved characters from the Toy Story series, which has a rich ensemble cast of toys and humans alike.", author_id: 1, ) {
    id,
    title,
    content,
    author_id,
    created_at,
    updated_at
  }
}

# QUERY USERS
query{
  Users{
    id,
	username,
    email,
    created_at,
    updated_at
  }
}

# QUERY USERS WITH THEIR POST DETAIL
query{
  Users{
    id,
	  username,
    email,
    created_at,
    updated_at,
    post {
      id,
      title,
      created_at
    }
  }
}

# QUERY POSTS
query{
  Posts{
    id,
    title,
    content,
    author_id,
    created_at,
    updated_at,
    author{
      email,
      id,
      username
    }
  }
}

# QUERY POST BY ID
query{
  Post(id:1){
    id,
    title,
    content,
    author_id,
    created_at,
    updated_at,
    author{
      id,
      username
    }
  }
}

# UPDATE POST BY ID
mutation {
  updatePost(
    id: 1,
    title: "Toy Story 2",
    content: "Here are some of the main characters from the Toy Story franchise: Woody - The main protagonist and leader of the toys.Buzz Lightyear - A space ranger action figure who becomes one of Andy's favorite toys. Jessie - A spirited cowgirl doll and member of Woody's Roundup Gang.Mr. Potato Head - A sarcastic and funny potato-shaped toy with detachable body parts. Rex - A lovable but timid Tyrannosaurus rex toy. Hamm - A wise-cracking piggy bank and one of Andy's toys. Slinky Dog - A loyal and stretchy toy dog with a slinky body. Bo Peep - A porcelain figurine and love interest of Woody. Aliens - The cute, three-eyed extraterrestrial toys from Pizza Planet. Andy - The owner of the toys and their human friend. These are just a few of the beloved characters from the Toy Story series, which has a rich ensemble cast of toys and humans alike.",
    author_id: 2
  )
}

# DELETE POST BY ID
mutation {
  deletePost(id:2)
}