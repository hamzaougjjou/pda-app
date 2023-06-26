
const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();


app.use(bodyParser.urlencoded({ extended: !true }));
app.use(cors());

// connect to mySql
var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'hamza',
    password: 'hamza',
    database: 'pda'
});

connection.connect();


function register(req, res) {
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
            res.json({ "token": token, "user": user });

        })
}

function login( req , res) {

    let { id, password } = req.query;

    let i = connection.query('SELECT * from users where ?', [1] );
    return i;

}

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


module.exports = { login, register }