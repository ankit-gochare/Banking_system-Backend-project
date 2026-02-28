import mongoose from 'mongoose'

// create blacklist token schema
const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "Token is required to blacklist" ],
        unique: [ true, "Token is already blacklisted" ]
    }
}, {
    timestamps: true
})

// craeating ttl(time to leave) for tokens
tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3 // 3 days
})

// create black list token model
const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlacklistSchema);

export default tokenBlackListModel