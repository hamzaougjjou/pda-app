

const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql');;
const multer = require('multer');
const path = require("path");
const app = express();
require('dotenv').config()


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// connect to mySql database
var connection = mysql.createConnection({
    host: "b8urbhjjqawd9w3ukybw-mysql.services.clever-cloud.com" ,
    user: "ukv9c9vpdg7hiwvg",
    password: "jBbszbEUjWB9d9tn9Hy9",
    database: "b8urbhjjqawd9w3ukybw"
});
connection.connect();


// =============================================================

//get a single product item
app.get('/test' , function (req, res) {



    connection.query('select * from test where 1'
        , [null]
        , (error, results, fields) => {

            //data base unknow error
            if (error) {
                res.status(500).send(
                    {
                        "success": false,
                        "message": "somthing went wrong"
                    }
                );
                return false;
            }

            //check if product not exists
            if (results.length == 0) {
                res.status(200).json({
                    "success": false,
                    "message": "product not found"
                })
                return false;
            }

            res.status(200).json({
                "success": true,
                "message": "product deleted successfully",
                "product": results
            })

            // ======================================
        });
})
// =============================================================

// creating a server
app.listen(8080 || process.env.PORT);