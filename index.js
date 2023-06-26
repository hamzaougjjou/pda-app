
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
    host: '127.0.0.1',
    user: 'hamza',
    password: 'hamza',
    database: 'pda'
});
connection.connect();

// create a new post
app.post('/register', function (req, res) {
    const auth = authenticateToken(req);

    //check if user loged in
    if (auth.status === false)
        res.status(400).json({
            "success": false,
            "message": "unauthorized",
        });


    let id = generateId();
    let name = req.query.name;
    let phone = req.query.phone;
    let company_id = auth.user.company_id;
    let adress = req.query.adress;
    let password = req.query.password;
    let created_by = auth.user.id;
    let role = 'siller';

    //validate data 
    if (!name) {
        res.status(404).send(
            {
                "success": false,
                "message": "name is required"
            }
        );
        return 0;
    }
    else if (name.trim().length < 3) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid name"
            }
        );
        return 0;
    }
    //validate data 
    if (!password) {
        res.status(404).send(
            {
                "success": false,
                "message": "password is required"
            }
        );
        return 0;
    }
    else if (password.trim().length < 3) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return 0;
    }

    //creatin seller by admin
    if (auth.user.role == "admin") {
        let role = 'siller';
        connection.query('INSERT INTO users (id,name,phone,company_id,adress,password,created_by,role) VALUE ( ? , ? , ? , ? , ? , ? , ? ,? )'
            , [id, name, phone, company_id, adress, password, created_by, role]
            , (error, result) => {
                if (error) {
                    res.status(500).send(
                        {
                            "success": false,
                            "message": 'Opp something went wrong'
                        }
                    );
                    return 0;
                }
                res.status(200).send(
                    {
                        "success": true,
                        "message": "user created",
                        "data": {
                            ...req.query,
                            "id": id,
                            "role": role,
                            "created_by": auth.user.name
                        }
                    }
                );
                return 0;
            });
    }
    //creation aff client by siller
    else if (auth.user.role == "siller") {
        let role = 'client';
        let sector_id = req.query.sector_id;
        if (!sector_id) {
            res.status(400).send(
                {
                    "success": true,
                    "message": "sector id is required"
                }
            );
            return 0;
        }
        connection.query('INSERT INTO users (id,name,phone,company_id,adress,password,created_by,role,sector_id) VALUE ( ? , ? , ? , ? , ? , ? , ? ,?,? )'
            , [id, name, phone, company_id, adress, password, created_by, role, sector_id]
            , (error, result) => {
                if (error) {
                    res.status(500).send(
                        {
                            "success": false,
                            "message": 'Opp something went wrong'
                        }
                    );
                    return 0;
                }
                res.status(200).send(
                    {
                        "success": true,
                        "message": "user created",
                        "data": {
                            ...req.query,
                            "id": id,
                            "role": role,
                            "created_by": auth.user.name
                        }
                    }
                );
                return 0;
            });
    }
    //auth user is client
    else {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
    }
})

// log in
app.post('/login', function (req, res) {
    let { id, password } = req.query;
    connection.query('select id,name,phone,company_id,adress,created_at,created_by,role from users where id=? and password=?'
        , [id, password]
        , (error, results, fields) => {
            if (error) {
                res.status(500).send(
                    {
                        "success": false,
                        "message": "somthing went wrong"
                    }
                );
            }
            const data = results;
            if (data.length == 0) {
                res.status(401).send(
                    {
                        "success": false,
                        "message": "user id or password not correct"
                    }
                );
            }
            else {
                let user = data[0];
                const token = generateToken(user);

                res.status(200).send(
                    {
                        "success": true,
                        "message": "user authorized",
                        "data": {
                            "user": user,
                            "token": token
                        }
                    }
                );
            }
            res.send(data[0]);
        });

})

//get a single user get all client search for client 
app.get('/clients', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "siller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized",
                "user": auth
            }
        );
        return false;
    }

    let q = req.query.query;
    let userId = auth.user.id;

    let myDbQuery1 = "select * from users where created_by=? and role='client'";
    if (q) {
        myDbQuery1 = "select * from users where created_by=? and (name like '%' ? '%' or id like '%' ? '%' ) and role='client'";
    }
    connection.query(myDbQuery1, [userId, q , q ]
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

            res.status(200).json({
                "success": true,
                "message": "clients retrieved successfully",
                "data": results
            })

            // ======================================

        });
})

//get a single user get all client search for client 
app.get('/sillers', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "admin") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let q = req.query.query;
    let userId = auth.user.id;

    let myDbQuery1 = "select * from users where created_by=? and role='siller'";
    if (q) {
        myDbQuery1 = "select * from users where created_by=? and (name like '%' ? '%' or id like '%' ? '%' ) and role='siller'";
    }
    connection.query(myDbQuery1, [userId, q , q ]
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

            res.status(200).json({
                "success": true,
                "message": "clients retrieved successfully",
                "data": results
            })

            // ======================================

        });
})

// upload file
let storagePath = 'uploads/images/products'
const storage = multer.diskStorage({
    destination: storagePath,
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + generateId() + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const newFilename = 'image_' + uniqueSuffix + fileExtension;
        cb(null, newFilename);
    }
});
const upload = multer({ storage: storage });

//create a new product by user
app.post('/product/create', upload.single('image'), function (req, res) {


    const auth = authenticateToken(req);

    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "siller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }
    let id = generateId();
    let { name, quantity, price } = req.body;
    let userId = auth.user.id;    //validate data 
    //check for a valid name
    if (!name) {
        res.status(404).send(
            {
                "success": false,
                "message": "name is required"
            }
        );
        return 0;
    }
    else if (name.trim().length < 1) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid name"
            }
        );
        return 0;
    }
    //check for a valid price
    if (!price) {
        res.status(404).send(
            {
                "success": false,
                "message": "price is required"
            }
        );
        return 0;
    } else if (isNaN(price) || price < 0) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid price"
            }
        );
        return 0;
    }
    //check for a valid quantity
    if (!quantity) {
        res.status(404).send(
            {
                "success": false,
                "message": "quantity is required"
            }
        );
        return 0;
    } else if (isNaN(quantity) || quantity < 0) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid quantity"
            }
        );
        return 0;
    }
    // Assuming you want to return the URL as a response
    let imageUrl = null;
    if (req.file)
        imageUrl = req.file.path;

    connection.query('INSERT INTO products (id,name,price,quantity,image,created_by) VALUES ( ? , ?  , ? , ? , ? , ? )'
        , [id, name.trim(), price, quantity, imageUrl, userId]
        , (error, results, fields) => {
            if (error) {
                res.status(500).send(
                    {
                        "success": false,
                        "message": "somthing went wrong"
                    }
                );
                return false;
            }

            // if data inserted successfully
            res.status(200).json({
                "success": true,
                "message": "data retrived successfully",
                "user": auth.user,
                'data': {
                    ...req.body,
                    "id": id,
                    "image": imageUrl
                }
            })
        });

})

// delete product
app.delete('/product/:id', upload.single('image'), function (req, res) {


    const auth = authenticateToken(req);


    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "siller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let productId = req.params.id;
    let userId = auth.user.id;

    connection.query('select * from products where id=?'
        , [productId]
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

            // check if if this product created by auth (current) user 
            if (results[0].created_by != userId) {
                res.status(401).send(
                    {
                        "success": false,
                        "message": "unautherized to delete this product"
                    }
                );
                return false;
            }


            // delete product
            // ======================================
            connection.query('delete from products where id=?'
                , [productId]
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

                    res.status(200).json({
                        "success": true,
                        "message": "product deleted successfully",
                        "data": results
                    })
                })
            // ======================================

        });
})

//get a single product item
app.get('/product/:id', upload.single('image'), function (req, res) {


    const auth = authenticateToken(req);

    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }

    let productId = req.params.id;

    connection.query('select * from products where id=?'
        , [productId]
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
                "product": results[0]
            })

            // ======================================
        });
})

//create an order
app.post('/order/create' , function (req , res ) {
    
    res.status(200).send( req.body );
})

//generate a login token
function generateToken(user) {
    return jwt.sign({ user: user }, process.env.JWT_SECRET);
}

//check auth token key
function authenticateToken(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return {
            status: false,
            message: 'Authentication token missing'
        };
    }

    try {
        const auth = jwt.verify(token, process.env.JWT_SECRET);
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

//generate a random id [wx78789]
function generateId() {
    // const alphabetUper = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // ====================================
    var randomID = "";

    // Generate a random letter from the letters array || vc
    var randomNumberIndex = Math.floor(Math.random() * letters.length);
    randomID += letters[randomNumberIndex];
    var randomNumberIndex = Math.floor(Math.random() * letters.length);
    randomID += letters[randomNumberIndex];

    // Generate the rest of the random ID ||89773
    for (var i = 0; i < 5; i++) {
        var randomIndex = Math.floor(Math.random() * 10);
        randomID += numbers[randomIndex];
    }
    return randomID; // vc89773
}


// creating a server
app.listen(process.env.APP_PORT || process.env.PORT);