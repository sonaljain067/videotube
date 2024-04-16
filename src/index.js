import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'
dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server succesfully running in ${process.env.PORT} port!!`)
    })
})
.catch((err) => {
    console.log("Mongodb connection failed!! ", err)
})

// Express Initialization in this file & DB Connection in Diff file 

/* DB Connection & Express Initialization in Same File
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"

import express from "express"
const app = express()

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log(error)
            throw err 
        })
        app.listen(process.env.PORT, () => {
            console.log(`Application is listening on ${process.env.PORT}`)
        })
    } catch(err) {
        console.log("error:", err)
        throw err 
    }
})()
*/ 