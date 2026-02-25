import express from 'express'
import authRouter from './routes/auth.routes.js'
import cookieParser from 'cookie-parser'

const app = express()

// to read the req.body data
app.use(express.json());
// to set token in cookie
app.use(cookieParser())


app.use("/api/auth" , authRouter);
export default app;