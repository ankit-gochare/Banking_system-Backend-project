import express from 'express'
import {registerUserController} from '../controllers/auth.controller.js'
import {userLoginController} from '../controllers/auth.controller.js'

const router = express.Router()

// POST api/auth/register
router.post('/register' , registerUserController )

// POST api/auth/login
router.post('/login' , userLoginController)

export default router