import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createAccountController } from '../controllers/account.controller.js'
import { getUserAccountsController } from '../controllers/account.controller.js'
import { getAccountBalanceController } from '../controllers/account.controller.js'

const router = express.Router()

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected route
 */
router.post("/" , authMiddleware , createAccountController )

/**
 * - GET /api/accounts/
 * - Get all the accounts of the logged-in user
 * - Protected route 
 */
router.get("/" , authMiddleware , getUserAccountsController )

/**
 * - GET /api/accounts/balance/:accountId
 * - Get the balance of the account
 * - Protected route 
 */
router.get("/balance/:accountId" , authMiddleware , getAccountBalanceController)

export default router