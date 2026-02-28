import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createTransaction } from '../controllers/transaction.controller.js'

const transactionRoutes = express.Router()

/**
 * - POST /api/transcations/
 * - Create a new transaction
 */
transactionRoutes.post("/" , authMiddleware , createTransaction )



export default transactionRoutes
