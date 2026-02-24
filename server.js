import dotenv from "dotenv"
dotenv.config()

import app from './src/app.js'

import connectToDB from "./src/config/db.js"
connectToDB()

app.get("/" , (req,res)=>{
    res.send("The server has started correctly")
})

app.listen(3000 , ()=>{
    console.log("The server is running on port 3000");
})