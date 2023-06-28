
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config()


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


//get a single product item
app.get('/test', function (req, res) {

    res.status(200).json({
        "success": true,
        "message": "product deleted successfully"
    })

})
// =============================================================

// creating a server
app.listen(8080 || process.env.PORT);