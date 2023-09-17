const mongoose = require("mongoose")

const authSchema = new mongoose.Schema({
    reader_name: {
        type: String,
        maxLength: 30,
        unique: true,
        required: [true, "Usrename should be provided"]
    },
    reader_email: {
        type: String,
        unique: true,
        required: [true, "Email should be provided"]
    },
    password: {
        type: String,
        required: [true, "Password should be provided"],
    },
    status: {
        type: Boolean,
        default: false
    },
    loginAttempt: {
        type: Number,
        default: 0
    },
    reader: {
        type: mongoose.Types.ObjectId,
        ref: "Reader",
        required: true
    },

}, { timestamps: true })

const Auth = mongoose.model("Auth", authSchema);
module.exports = Auth;