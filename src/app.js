import express from 'express'
import cookieParser from 'cookie-parser'

const app = express()

// to read the req.body data
app.use(express.json());
// to set token in cookie
app.use(cookieParser())


/**
 * - Import Routes
*/
// authRouter from auth.model.js
import authRouter from './routes/auth.routes.js'
// accountRouters from account.routes.js
import accountRouter from './routes/account.routes.js'

/**
 * - Use Routes 
*/
app.use("/api/auth" , authRouter);
app.use("/api/accounts" , accountRouter)
export default app;