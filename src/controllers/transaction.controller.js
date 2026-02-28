import transactionModel from "../models/transaction.model.js";
// to start session
import mongoose from 'mongoose'
import ledgerModel from "../models/ledger.model.js";
import accountModel from "../models/account.model.js"
import {sendRegistrationEmail , sendTransactionEmail , sendTransactionFailureEmail} from "../services/email.service.js"

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
    let transaction;
    try{
    const session = await mongoose.startSession()
    session.startTransaction()

    // create transaction
    // but we will not store it directly in the databse
    transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], {session}))[0]

    // now create debit and credit ledger entries
    const debitLedgerEntry = await ledgerModel.create([{
        account:fromAccount,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    }], {session})

    // to check if connection is weak 
    // await (()=>{
    //     return new Promise((resolve)=> setTimeout(resolve, 100*1000))
    // });

    const creditLedgerEntry = await ledgerModel.create([{
        account :toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    } ], {session})

    // if everything executes successfully then update the status of the transaction
    // and save the transaction
    await transactionModel.findOneAndUpdate(
        {_id: transaction._id},
        {status:"COMPLETED"},
        {session}
    )

    // now commit and end the transaction
    await session.commitTransaction()
    session.endSession();
    }catch(error){
        return res.status(400).json({
            message:"Transaction is pending due to some issue please retry after sometime"
        })
    }

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

// controller for initial funds in account from the system user
export async function createInitialFundsTransaction(req, res) {
    // take out the info from request body
    const { toAccount, amount, idempotencyKey } = req.body

    // if any field is empty then return
    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    // find the account to which you have to transfer the amount
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    // if to Account not exists return
    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    // find the account from which you want to transfer the amount
    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    // if fromAccount not exists return
    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    // create a session so all the work will done
    // or nothing is saved
    const session = await mongoose.startSession()
    session.startTransaction()

    // create transaction
    // but not directly in the database
    // only created at the client side 
    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    // create debit ledger entry
    const debitLedgerEntry = await ledgerModel.create( [{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })
    // whenever we use session the data is passed in form of array

    // create credit ledger entry
    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }] , { session })

    // update the transaction status
    transaction.status = "COMPLETED"
    await transaction.save({ session })

    // commit and end the session to save changes 
    await session.commitTransaction()
    session.endSession()

    // return successful transaction
    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}

