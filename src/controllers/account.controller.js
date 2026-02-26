import accountModel from '../models/account.model.js'

export async function createAccountController(req,res){
    // take out user from req
    const user = req.user

    // create a new account 
    const account = await accountModel.create({
        user:user._id,
    })

    // 
    res.status(201).json({
        account
    })
}