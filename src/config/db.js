import mongoose from 'mongoose'

async function connectToDB(){
    
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server is connected to DB");
    })
    .catch(err =>{
        console.log("Error Connecting to DB")
        process.exit(1) // if are not getting connected to the databse then stop the server too 
    })
}

export default connectToDB;