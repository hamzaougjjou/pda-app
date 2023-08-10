

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

    let userId = req.params.id;

    let password = req.query.password;
    let newPassword = req.query.newPassword;
    let confirmNewPassword  = req.query.confirmNewPassword;

    if (!password || password.trim().length < 6) {
        res.status(200).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return false;
    }

    if ( oldPassword.length() < 6 ){
        res.status(200).send(
            {
                "success": false,
                "message": "invalid password"
            }
        );
        return false;
    }
    if ( newPassword.length() < 6 ){
        res.status(200).send(
            {
                "success": false,
                "message": "invalid new password"
            }
        );
        return false;
    }
    if ( confirmNewPassword.length() < 6 ){
        res.status(200).send(
            {
                "success": false,
                "message": "invalid confirm new password"
            }
        );
        return false;
    }
    if ( newPassword != confirmNewPassword ){
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
                        "errorCode": 0,
                        "message": "old password not correct"
                    }
                );
                return false;
            }
            connection.query( "update users set password=? where id=?",
             [ userId , password]
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
                        "message": "password updated successfully"
                    })

                });
        })


})