const express = require("express");
const path=require('path');


const port = process.env.PORT || 3001;

const app = express();
const publicpath=path.join(__dirname,'public')
console.log(publicpath);


app.use(express.static(publicpath));

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
