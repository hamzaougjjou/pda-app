
const express = require('express')
const cors = require('cors');
var mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

// connect to mySql
var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'hamza',
    password: 'hamza',
    database: 'jwt_expo'
});
connection.connect();


// create a new post
app.post('/register', function (req, res) {

    let name = req.query.name;
    let email = req.query.email;
    let password = req.query.password;

    if (!name) {
        res.send({ 'message': "name is required" });
        return false;
    }
    if (!email) {
        res.send({ 'message': "email is required" });
        return false;
    }
    if (!password) {
        res.send({ 'message': "paswword field is required" });
        return false;
    }

    if (password.length < 6) {
        res.send({ 'message': "invalid password" });
        return false;
    }

    connection.query('insert into `users` ( name ,email , password ) values (? , ? , ? )', [name, email, password]
        , function (error, results, fields) {
            if (error) {
                res.send({ 'message': "error to create account", 'error': error });
                return false;
            }

            const user = {
                "id": results.insertId,
                "name": name,
                "email": email
            }
            const token = jwt.sign({ user: data[0] }, 'secretKey');
            res.json({ "token": token , "user" : user  });

        })

});

// log in
app.post('/login', function (req, res, next) {
    connection.query('SELECT id,name,email from `users` WHERE `email` = ? and `password` = ? ', [req.query.email, req.query.password]
        , function (error, results, fields) {
            if (error) {
                res.send({ 'error': "something went wrog" });
            }
            else {
                data = results;
                const token = jwt.sign({ user: data[0] }, 'secretKey');
                res.json({ "token": token , "user" : data[0]  });
            }
        });

})

// create a new post
app.post('/posts/create', function (req, res) {
    let auth = authenticateToken(req, res);
    if (auth.status == false) {
        res.json({
            status: false,
            message: 'unauthorized'
        }
        );
        return false;
    }

    let content = req.query.content;
    let user_id = auth.user.id;

    if (!content) {
        res.send({ 'message': "content field is require" });
        return false;
    }

    connection.query('insert into `posts` ( user_id , content ) values (? , ? )', [user_id, content]
        , function (error, results, fields) {
            if (error) {
                res.send({ 'message': "error to create post", 'error': error });
                return false;
            }
            res.send({
                'message': "post creates", "post": {
                    'id': results.insertId,
                    "content": content,
                    'user_id': user_id
                }
            });
        })

});

//get all posts
app.get('/', function (req, res) {

    let auth = authenticateToken(req, res);

    if (auth.status == false) {
        res.json({
            status: false,
            message: 'unauthorized'
        }
        );
    }
    else {
        connection.query('SELECT * FROM `posts` ', function (error, results, fields) {
            if (error) {
                console.log('error');
            }
            else {
                data = results;
                res.json({ "posts": data })
            }

        });

    }

});

//get a single post by id
app.get('/post/:id', function (req, res, next) {

    let auth = authenticateToken(req, res);
    id = req.params.id;

    if (auth.status == false) {
        res.json({
            status: false,
            message: 'unauthorized'
        }
        );
        return false;
    }

    connection.query('SELECT * from `posts` WHERE `id` = ? ', [id]
        , function (error, results, fields) {
            if (error) {
                res.send({ 'error': "something went wrog" });
                return false;
            }

            data = results;
            if (data.length == 0) {
                res.send({ 'error': "product id not found" });
                return false;
            }


            res.json({ 'post': results[0] });

        });


});

//update a post
app.put('/post/:id', function (req, res) {

    let auth = authenticateToken(req, res);
    id = req.params.id;

    if (auth.status == false) {
        res.json({
            status: false,
            message: 'unauthorized'
        }
        );
        return false;
    }

    connection.query('SELECT * from `posts` WHERE `id` = ? ', [id]
        , function (error, results, fields) {
            if (error) {
                res.send({ 'error': "something went wrog" });
                return false;
            }

            data = results;
            if (data.length == 0) {
                res.send({ 'error': "post id not found" });
                return false;
            }


            //update post
            connection.query('update `posts` set `content` = ? where id = ? ', [req.query.content, id]
                , function (error, results, fields) {

                    if (error) {
                        res.send({ 'error': "error to update post" });
                        return false;
                    }
                    res.send({ 'message': "post updated" });
                })

        });

});

// check if user is loged in
function authenticateToken(req, res) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return {
            status: false,
            message: 'Authentication token missing'
        };
    }

    try {
        const auth = jwt.verify(token, 'secretKey');
        return {
            status: true,
            user: auth.user
        };

    } catch (error) {
        return {
            status: false,
            message: 'invalid token'
        };
    }


}


// creating a server
app.listen(8080);