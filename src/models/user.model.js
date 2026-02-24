import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[ true , "Email is required to create a user"],
        trim:true,
        lowercase:true,
        match:[ /^[a-zA-Z0-9.!#$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$/ ,  "Invalid email address"
        ],
        unique:[true,"Email already exists"]
    },
    name:{
        type:String,
        required:[true,"Name is required to create an account"]
    },
    password:{
        type:String,
        required:[true,"Password id required to create an account."],
        minlength:[6,"Password should contain atleast 6 characters"],
        select:false // so that the password will not get selected when we are trying to access user data by any query
    }
},{
    timestamps:true, // details of the time when user is created or updated 
    // both info will be here 
}) 

// if the user has changed the password then hash the password
userSchema.pre("save" , async function(next){
    // if the password is not modified then return to next
    if(!this.isModified("password")){
        return next()
    }

    // if the password is modified
    // hash the password
    const hash = await bcrypt.hash(this.password , 10);

    // save password value to hash
    this.password = hash 

    // return to next
    return next;
})

// to compare passwords
userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password , this.password)
}

// userModel
const userModel = mongoose.model("user" , userShema)

export default userModel;



