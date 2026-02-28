import accountModel from '../models/account.model.js'

// controller to create a new account 
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

// controller to get all the accounts of a logged-in uset
export async function getUserAccountsController(req, res) {

    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        accounts
    })
}

// controller to get the balance of an account 
export async function getAccountBalanceController(req, res) {
    // take the accountId from params
    const { accountId } = req.params;

    // chcek if the account id is of the same user which is requestion for balance 
    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    // if not return
    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    // getBalance method created in accountmodel 
    const balance = await account.getBalance();

    // return balance 
    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}
