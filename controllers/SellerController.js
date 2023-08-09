app.post('/seller/create', function (req, res) {

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

    let id = generateId();
    let { name, phone, password } = req.query;
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
    if (!password) {
        res.status(400).send(
            {
                "success": false,
                "message": "password is required"
            }
        );
        return 0;
    } else if (password.length < 6) {
        res.status(400).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return 0;
    }

    if (!phone) {
        phone = null;
    }

    let role = 'seller';
    if (auth.user.role.toLocaleLowerCase() == "seller") {
        role = "client";
    }

    connection.query('INSERT INTO users (id,name,phone,password,role,created_by) VALUES ( ? , ?  , ? , ? , ? , ? )'
        , [id, name.trim(), phone, password, role, userId]
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
                "message": "user created successfully",
                'user': {
                    ...req.query,
                    "id": id,
                }
            })
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

                    res.status(200).json({
                        "success": true,
                        "message": "user updated successfully",
                        "result": results2
                    })

                });
        })


})