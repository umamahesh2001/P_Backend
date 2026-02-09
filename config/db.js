// const mongoose=require('mongoose')
// const configDb=async()=>{
//     try{
//         const db= mongoose.connect('mongodb://127.0.0.1:27017/parking-space')
//         console.log('connected to db')
//     }catch(err){
//         console.log('error in connecting')
//     }


// }
// module.exports=configDb
const mongoose = require("mongoose");
require("dotenv").config();

const configDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Database ");
    } catch (err) {
        console.error("Error connecting to Database", err.message);
        process.exit(1);
    }
};

module.exports = configDb;
