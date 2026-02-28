import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createTransaction } from '../controllers/transaction.controller.js'
import { authSystemUserMiddleware } from '../middleware/auth.middleware.js'
import { createInitialFundsTransaction } from '../controllers/transaction.controller.js'

const transactionRoutes = express.Router()

/**
 * - POST /api/transcations/
 * - Create a new transaction
 */
transactionRoutes.post("/" , authMiddleware , createTransaction )


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authSystemUserMiddleware, createInitialFundsTransaction)

export default transactionRoutes
