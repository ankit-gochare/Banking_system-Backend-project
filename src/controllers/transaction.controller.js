import transactionModel from "../models/transaction.model.js";
import ledgerModel from "../models/ledger.model.js";
import accountModel from "../models/account.model.js"
import {sendRegistrationEmail , sendTransactionEmail , sendTransactionFailureEmail} from "../services/email.service.js"


// to create session
import mongoose from "mongoose"

/**
 * - Create a new transaction
 * The 10 step transfer flow
    * 1. Validate request
    * 2. Validate idempotency key
    * 3. Check account status
    * 4. Derive senfder balance from ledger
    * 5. Create transaction
    * 6. Create DEBIT ledger entry
    * 7. Create CREDIT ledger entry
    * 8. Mark transaction COMPLETED
    * 9. Commit MongoDB session
    * 10. send email notification 
 */

export async function createTransaction(req,res){
    /** 
     * 1. Validate request
    */
    // take out informations from the request body
    const { fromAccount , toAccount , amount , idempotencyKey} = req.body

    // if any of the info is not given then return
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"Fromaccount , ToAccount , Amount and idempotencyKey all are required"
        })
    }

    // chcek if the fromAccount and the toAccount exists or not 
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    }) 

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    // if any one of the 2 accounts, does not exists , return
    if(!fromAccount || !toAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    } 

    /** 
     * 2. Validate idempotencyKey
    */

    // check if transaction with this same idempotencyKey exists or not 
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    // if transaction alraeady exists 
    // 1. and also got completed
    // 2. is still pending
    // 3. has been failed
    // 4. has been reversed
    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status ===    "Completed"){
            return res.status(200).json({
            message: "Transaction already processed",
            transaction: isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }

        if(isTransactionAlreadyExists.status==="FAILED"){
            return res.status(500).json({
                message:"Transaction processing failed , please retry "
            })
        }

        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({
                message:"Transaction was reversed , please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */
    // if any of the account is not ACTIVE then stop the transaction, return
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message:"Both FromAccount and ToAccount must be ACTIVE to process transaction"
        })   
    }

    /**
     * 4. Derive sender balance from ledger 
     */
    const balance = await fromUserAccount.getBalance()

    // if balance is less than the amout , return
    if(balance< amount){
        return res.status(400).json({
            message:`Insufficient balance in ${fromAccount}. Current balance is ${balance} and the requested amount is ${amount}`
        })
    }

    // otherwise we are ready to create a gtransaction

    /**
     * 5. Create transaction (pending)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
    */
    // start transcation 
    // iske baad ya to sab completed ho jayega 
    // ya kuchh bhi save nhi hoga 
    const session = await mongoose.startSession()
    session.startTransaction()

    // create transaction
    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, {session})

    // now create debit and credit ledger entries
    const debitLedgerEntry = await ledgerModel.create({
        account:fromAccount,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    }, {session})

    const credirLedgerEntry = await ledgerModel.create({
        account :toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    } , {session})

    // if everything executes successfully then update the status of the transaction
    // and save the transaction
    transaction.status = "COMPLETED"
    await transaction.save({session})

    // now commit and end the transaction
    await startSession.commitTransaction()
    session.endSession();

    /**
     * 10. send email notification 
    */
   await sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount,
   )

   return res.status(201).json({
    message:"Transaction completed successfully",
    transaction: transaction
   })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })


}

