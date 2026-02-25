import userModel from '../models/user.model.js'
import jwt from 'jsonwebtoken'

/**
* - user regsiter controller
* - POST api/auth/register
*/ 
export async function registerUserController(req,res){
    // taking data from req.body
    const {name , email , password} = req.body;

    // first check if user alraedy exists 
    const isUserAlreadyExists = await userModel.findOne({
        email:email
    }) 

    // if user alraedy exists then the return user already exists
    if(isUserAlreadyExists){
        return res.status(401).json({
            message:"User already exists with this email.",
            status : "Failed"
        })
    }

    // if user doesnot exists create user 

    const user = await userModel.create({
        email , name , password
    })

    // genarate token for the user 
    const token = jwt.sign({userId : user._id} , process.env.JWT_SECRET, {expiresIn: "3d"})

    // setting the toke into cookies
    res.cookie("token" , token)

    // send the successfull craetion response
    res.status(201).json({
        user:{
            _id : user._id,
            name:user.name,
            email:user.email
        },
        token
    })
}


/**
 * - user Login Controller
 * - POST /api/auth/login
 */

export async function userLoginController(req,res){

    // take email and password from the request
    const {email,password} = req.body;

    // find the user in database
    // password alag se select krna pdega kyuki select false kr diya h 
    const user = await userModel.findOne({email}).select("+password")

    // if user not exist return 
    if(!user){
        return res.status(401).json({
            message:"Email or password is INVALID"
        })
    }

    // if user exists 
    // compare the password enterd by the user from the database stored password
    // using the comparePassword method in userSchema
    const isValidPassword = await user.comparePassword(password)

    // if password is not correct return 
    if(!isValidPassword){
        return res.status(401).json({
            message:"Email or password is INVALID"
        })    
    }

    // if password is also correct then generate a token 
    const token = jwt.sign({userId: user._id} , process.env.JWT_SECRET , {expiresIn: "3d"})

    // set the token in cookie 
    res.cookie("token" , token)

    // send the response
    res.status(200).json({
        user:{
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}

