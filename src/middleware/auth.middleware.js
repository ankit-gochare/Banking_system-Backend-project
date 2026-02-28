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

export async function authSystemUserMiddleware(req,res,next){

    // chcek for the tokens
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    // if not token then return
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    // chcek if the token is blacklisted or not 
    // const isBlacklisted = await tokenBlackListModel.findOne({ token })

    // if (isBlacklisted) {
    //     return res.status(401).json({
    //         message: "Unauthorized access, token is invalid"
    //     })
    // }

    // if token exists // chcek if the token is correct or not
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser") // because we have done select false for systemUser

        // if the user is not a system user then return
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        // set the user to request user for the next controller
        req.user = user

        // retrun to next controller
        return next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}