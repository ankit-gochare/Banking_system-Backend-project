import mongoose from 'mongoose'
import ledgerModel from '../models/ledger.model.js'

const accountSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true , "Account must be associated with a user"],
        index:true // to optimizing searching for the accounts of a user
    },
    status:{
        type:String,
        enum:{
            values:[ "ACTIVE" , "FROZEN" , "CLOSED"],
            message:"Status can be either ACTIVE , FROZEN OR CLOSED"
        },
        default:"ACTIVE"
    },
    currency:{
        type:String,
        required:[true , "Currency is required for creating an account"],
        default: "INR"
    }
},{
    timestamps:true
})

accountSchema.index({user:1 , status:1})

// to get the balance of an account
accountSchema.methods.getBalance = async function(){
    // find all the ledger entries wjose id matches with this id
    const balanceData = await ledgerModel.aggregate([
        {
            $match: {account: this._id}
        },
        {
            $group:{
                _id:null, // because we need only a single sum for all the debits and credits
                totalDebit:{
                    $sum:{
                        $cond:[ // if the type of ledger entry is DEBIT then add the amount in sum 
                        // otherwise add 0
                            {$eq: ["$type" , "DEBIT"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq:["$type", "CREDIT"]},
                            "$amount",
                            0
                        ]
                    }
                }
            }
            },
            {
                $project:{
                    _id:0,
                    balance:{
                        $subtract:["$totalCredit" , "$totalDebit"]
                    }
                }
            }
    ]);

    // now if the account is new and do not have any ledger entries then we will get 
    // an empty array in balanceData
    // then wehave to return balance as 0
    if(balanceData.length === 0){
        return 0
    }

    // iif the account has some balance return it
    return balanceData[0].balance

}

const accountModel = mongoose.model("account" , accountSchema)

export default accountModel