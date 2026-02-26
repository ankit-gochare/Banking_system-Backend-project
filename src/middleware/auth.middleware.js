import userModel from "../models/user.model.js"
import jwt, { decode } from 'jsonwebtoken'

export async function authMiddleware(req,res,next){
    // check if token is present 
    // we will be chceking token in both cookie and headers authorization
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    // if token not present 
    // means the user is not logged in, return
    if(!token){
        return res.status(401).jso({
            message:"Unauthorized accessed , token is missing"
        })
    }

    // if token is present then where token 
    try{
        const decoded = jwt.verify(token , process.env.JWT_SECRET)
        // if token gets verified then we have user ki id in decoded

        // find the user by id
        const user = await userModel.findById(decoded.userId)
        
        // save the user as req.user and send it to controller
        req.user = user
        return next()
    }
    catch(err){
        return res.status(401).json({
            message:"Unauthorized access , token is invalid"
        })
    }


}