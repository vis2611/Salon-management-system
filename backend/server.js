const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello world");
})

app.listen(5000,()=>{
    console.log("Server is listening on 5000 port");
})
