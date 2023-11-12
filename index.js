


const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql');;
// const multer = require('multer');
// const path = require("path");
const app = express();
require('dotenv').config();

//convert data cams from user to JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//allow to all devices to send and recieve requests from this server(url)
app.use(cors());

// connect to mySql database
var connection = mysql.createConnection({
    host: "b8urbhjjqawd9w3ukybw-mysql.services.clever-cloud.com",
    user: "ukv9c9vpdg7hiwvg",
    password: "jBbszbEUjWB9d9tn9Hy9",
    database: "b8urbhjjqawd9w3ukybw"
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
    let role = 'seller';

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
    else if (password.trim().length < 6) {
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
        role = 'seller';
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
    //creation aff client by seller
    else if (auth.user.role == "seller") {
        let role = 'client';
        let sector_id = req.query.sectur_id;
        if (!sector_id) {
            res.status(400).send(
                {
                    "success": true,
                    "message": "sectur id is required"
                }
            );
            return 0;
        }
        connection.query('INSERT INTO users (id,name,phone,company_id,address,password,created_by,role,sectur_id) VALUE ( ? , ? , ? , ? , ? , ? , ? ,?,? )'
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

//update a auth user password
app.put('/auth/password', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "admin" && auth.user.role != "seller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let userId = auth.user.id;

    let oldPassword = req.query.oldPassword;
    let newPassword = req.query.newPassword;
    let confirmNewPassword = req.query.confirmNewPassword;

    if (!oldPassword || oldPassword.trim().length < 6) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return false;
    }
    if (!oldPassword) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid new password"
            }
        );
        return false;
    }
    if (oldPassword.length < 6) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return false;
    }
    if (!newPassword) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid new password"
            }
        );
        return false;
    }
    if (newPassword.length < 6) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid new password"
            }
        );
        return false;
    }
    if (!confirmNewPassword) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid confirm new password"
            }
        );
        return false;
    }
    if (confirmNewPassword.length < 6) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid confirm new password"
            }
        );
        return false;
    }
    if (newPassword != confirmNewPassword) {
        res.status(200).send(
            {
                "success": false,
                "message": "new password and cofirm new new password not the same"
            }
        );
        return false;
    }

    connection.query("select * from users where ( id=? and password=? ) "
        ,
        [userId, oldPassword]
        , (error1, results1, fields1) => {
            //data base unknow error
            if (error1) {
                res.status(200).send(
                    {
                        "success": false,
                        "message": "somthing went wrong"
                    }
                );
                return false;
            }
            if (results1.length == 0) {

                res.status(200).send(
                    {
                        "success": false,
                        "errorCode": 0,
                        "message": "old password not correct"
                    }
                );
                return false;
            }
            connection.query("update users set password=? where  id=?",
                [newPassword, userId]
                , (error2, results2, fields3) => {
                    //data base unknow error
                    if (error2) {
                        res.status(200).send(
                            {
                                "success": false,
                                "message": "somthing went wrong"
                            }
                        );
                        return false;
                    }

                    res.status(200).json({
                        "success": true,
                        "message": "password updated successfully"
                    })

                });
        })


})

// log in
app.post('/login', function (req, res) {

    let id = req.query.id
    let password = req.query.password;

    //validate data 
    if (!id) {
        res.status(404).send(
            {
                "success": false,
                "message": "id is required"
            }
        );
        return 0;
    }
    else if (id.trim().length < 2) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid id"
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
    else if (password.trim().length < 6) {
        res.status(404).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return 0;
    }

    connection.query('select * from users where id=? and password=?'
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
            } else {
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
        });

})

//get a single user get all client search for client 

//delete a seller by admin
app.delete('/user/:id', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "admin" && auth.user.role != "seller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let sellerId = req.params.id;

    connection.query("delete from users where id=? and role!='admin'",
        [sellerId]
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
                "message": "seller deleted successfully"
            })

            // ======================================

        });
})

//get a single user get all client and sellers || search for client and sellers
app.get('/users', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "admin" && auth.user.role != "seller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let queryRole = "seller";
    if (auth.user.role == "seller") {
        queryRole = "client";
    }


    let q = req.query.q;
    let userId = auth.user.id;

    let myDbQuery1 = "select * from users where created_by=? and role=? ";
    let queryParams = [userId, queryRole]
    if (q) {
        myDbQuery1 = "select * from users where created_by=? and (name like '%' ? '%' or id like '%' ? '%' ) and role=? ";
        queryParams = [userId, q, q, queryRole]
    }

    if (req.query.sector && auth.user.role === "seller") {
        myDbQuery1 = myDbQuery1 + "and sector=? ";
        queryParams.push(req.query.sector);
    }

    connection.query(myDbQuery1, queryParams
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
                "message": "sellers retrieved successfully",
                "data": results
            })

            // ======================================

        });
})

//create a new user by user
app.post('/user/create', function (req, res) {

    const auth = authenticateToken(req);
    let password = null;
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "admin" && auth.user.role != "seller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let id = generateId();
    let { name, phone } = req.query;
    let userId = auth.user.id;    //validate data 
    //check for a valid name
    if (!name) {
        res.status(400).send(
            {
                "success": false,
                "message": "name is required"
            }
        );
        return 0;
    }
    else if (name.trim().length < 1) {
        res.status(400).send(
            {
                "success": false,
                "message": "invalid name"
            }
        );
        return 0;
    }
    //check for a valid price
    if (!password && auth.user.role.toLocaleLowerCase() != "seller") {
        res.status(400).send(
            {
                "success": false,
                "message": "password is required"
            }
        );
        return 0;
    } else if (password && password.length < 6 && auth.user.role.toLocaleLowerCase() == "seller") {
        res.status(400).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return 0;
    }

    if (req.query.password) {
        password = req.query.password;
    }

    if (!phone) {
        phone = null;
    }

    let role = 'seller';
    let sector = null;
    if (auth.user.role.toLocaleLowerCase() == "seller") {
        role = "client";
        sector = req.query.sector;
    }

    connection.query('INSERT INTO users (id,name,phone,password,role,created_by,sector) VALUES ( ? , ?  , ? , ? , ? , ? , ?)'
        , [id, name.trim(), phone, password, role, userId, sector]
        , (error, results, fields) => {
            if (error) {
                res.status(500).send(
                    {
                        "success": false,
                        "error": error,
                        "message": "somthing went wrong2"
                    }
                );
                return false;
            }

            // if data inserted successfully
            res.status(200).json({
                "success": true,
                "message": "user created successfully",
                'user': {
                    ...req.query,
                    "id": id,
                }
            })
        });

})

//update a seller by admin
app.put('/user/:id', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    let authRole = auth.user.role;
    if (authRole != "admin" && authRole != "seller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let userId = req.params.id;
    let name = req.query.name;
    let password = req.query.password;
    let phone = req.query.phone;
    let sector = req.query.sector;

    if (!name || name.trim().length < 1) {
        res.status(500).send(
            {
                "success": false,
                "message": "invalid name"
            }
        );
        return false;
    }

    if (authRole === "admin")
        if (!password || password.trim().length < 6) {
            res.status(500).send(
                {
                    "success": false,
                    "message": "invalid password"
                }
            );
            return false;
        }


    let parameters = [name, password, userId];
    let q = "update users set name=? , password=? where id=?";

    if (authRole === "seller") {
        q = "update users set name=? , sector=? where id=?";
        parameters = [ name , sector , userId];
    }

    if (phone) {
        q = "update users set name=? , password=? , phone=? where id=?";
        parameters = [name, password, phone, userId];
        if (authRole === "seller") {
            q = "update users set name=? , phone=? , sector=? where id=?";
            parameters = [name , phone, sector , userId];
            return false;
        }
        q = "update users set name=? , password=? , phone=? where id=?";
        parameters = [name, password, phone, userId];
    }

    connection.query(q, parameters
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
                "message": "seller updated successfully",
                "result": results
            })

            // ======================================

        });
})

app.get('/products', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }


    let userId = auth.user.id;
    let q = req.query.q;
    let myDbQuery1 = "select * from products where (created_by=? or seller_id=?) and (name like '%' ? '%' or id like '%' ? '%' )";
    connection.query(myDbQuery1, [userId, userId, q, q]
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
                "message": "products retrieved successfully",
                "data": results
            })

            // ======================================

        });
})

//update a auth user
app.put('/auth/:id', function (req, res) {
    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "admin" && auth.user.role != "seller") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }

    let userId = req.params.id;
    let name = req.query.name;
    let password = req.query.password;
    let phone = req.query.phone;

    if (!name || name.trim().length < 1) {
        res.status(500).send(
            {
                "success": false,
                "message": "invalid name"
            }
        );
        return false;
    }

    if (!password || password.trim().length < 6) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return false;
    }


    let parameters = [name, password, userId];
    let q = "update users set name=? , password=? where id=?";

    if (phone) {
        q = "update users set name=? , password=? , phone=? where  id=? ";
        parameters = [name, password, phone, userId];
    }


    connection.query("select * from users where ( id=? and password=? ) "
        ,
        [userId, password]
        , (error1, results1, fields1) => {
            //data base unknow error
            if (error1) {
                res.status(500).send(
                    {
                        "success": false,
                        "message": "somthing went wrong"
                    }
                );
                return false;
            }
            if (results1.length == 0) {

                res.status(200).send(
                    {
                        "success": false,
                        "message": "password not correct"
                    }
                );
                return false;
            }
            connection.query(q, parameters
                , (error2, results2, fields3) => {
                    //data base unknow error
                    if (error2) {
                        res.status(500).send(
                            {
                                "success": false,
                                "message": "somthing went wrong"
                            }
                        );
                        return false;
                    }

                    let user = {
                        ...results1[0],
                        "name": name
                    }
                    if (phone) {
                        user = {
                            ...user,
                            "phone": phone
                        }
                    }

                    res.status(200).json({
                        "success": true,
                        "message": "user updated successfully",
                        "user": user
                    })

                });
        })


})

//create a new product by user
app.post('/product/create', function (req, res) {


    const auth = authenticateToken(req);

    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "seller" && auth.user.role != "admin") {
        res.status(401).send(
            {
                "success": false,
                "message": "unautherized"
            }
        );
        return false;
    }
    let id = generateId();
    let { name, quantity, price } = req.query;
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
    let sellerId = null;
    if (auth.user.role == "seller") {
        sellerId = userId;
    }

    let imageUrl = null;

    connection.query('INSERT INTO products (id,name,price,quantity,image, seller_id ,created_by) VALUES ( ? , ?  , ? , ? , ? , ? , ? )'
        , [id, name.trim(), price, quantity, imageUrl, sellerId, userId]
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
                "message": "product created successfully",
                "user": auth.user,
                'product': {
                    ...req.query,
                    "id": id,
                    "image": imageUrl
                }
            })
        });

})

// // delete product
app.put('/product/:id', function (req, res) {

    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "seller" && auth.user.role != "admin") {
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

    let name = req.query.name;
    let price = req.query.price;
    let quantity = req.query.quantity;

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
            if (!(results[0].created_by == userId || results[0].seller_id == userId)) {
                res.status(401).send(
                    {
                        "success": false,
                        "message": "unautherized to update this product"
                    }
                );
                return false;
            }

            // delete product
            // ======================================
            connection.query("update products set name=? , price=? , quantity=? where id=?"
                , [name, price, quantity, productId]
                , (error, results, fields) => {
                    //data base unknown error
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
                        "message": "product updated successfully",
                        "data": results
                    })
                })
            // ======================================

        });
})
// // delete product
app.delete('/product/:id', function (req, res) {

    const auth = authenticateToken(req);
    //check if user loged in
    if (auth.status === false) {
        res.status(401).json({
            "success": false,
            "message": "unauthenticated",
        });
        return false;
    }
    if (auth.user.role != "seller" && auth.user.role != "admin") {
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
            connection.query('delete from products where id=? and ( created_by=? or seller_id=?)'
                , [productId, userId, userId]
                , (error, results, fields) => {
                    //data base unknown error
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

//create an order
app.post('/order/create', function (req, res) {
    res.status(200).send(req.body);
})

//get company information
app.get('/company/info', function (req, res) {
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
        res.status(401).json({
            "success": false,
            "message": "unautherized",
        });
        return false;
    }


    let comdanyId = auth.user.company_id;

    let myDbQuery1 = "select * from company where id=? limit 1";
    connection.query(myDbQuery1, [comdanyId]
        , (error, results, fields) => {
            //data base unknow error
            if (error) {
                res.status(500).send(
                    {
                        "success": false,
                        "message": "somtehing went wrong"
                    }
                );
                return false;
            }

            res.status(200).json({
                "success": true,
                "message": "company info retrieved successfully",
                "data": results[0]
            })

            // ======================================

        });
})

//update company information
app.put('/company/update', function (req, res) {
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
        res.status(401).json({
            "success": false,
            "message": "unautherized",
        });
        return false;
    }


    let comdanyId = auth.user.company_id;

    let companyName = req.query.name ? req.query.name : null;
    let companyAddress = req.query.address ? req.query.address : null;
    let companyPhone = req.query.phone ? req.query.phone : null;
    let companyLogo = req.query.logo;

    if (companyName === null) {
        res.status(500).json({
            "success": false,
            "message": "company name is required",
        });
        return false;
    }

    let myDbQuery = "update company set name=? , address=? , phone=? , logo=? where id=?";
    let params = [companyName, companyAddress, companyPhone, companyLogo, comdanyId];


    connection.query(myDbQuery, params,
        (error, results, fields) => {
            //data base unknow error
            if (error) {
                res.status(500).send(
                    {
                        "success": false,
                        "message": "somtehing went wrong"
                    }
                );
                return false;
            }

            res.status(200).json({
                "success": true,
                "message": "company info updated successfully",
                "data": results[0]
            })

            // ======================================

        });
})

//generate a login token
function generateToken(user) {
    return jwt.sign({ user: user }, "CKOo8qDADlUHrPHKe3znFowr7OeuIuAEhBRr3mBLlwOvIKxTUJn57Vgmn83LeMe4");
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
        const auth = jwt.verify(token, "CKOo8qDADlUHrPHKe3znFowr7OeuIuAEhBRr3mBLlwOvIKxTUJn57Vgmn83LeMe4");
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
app.listen(8080 || process.env.PORT);