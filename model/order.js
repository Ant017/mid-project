const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    cart: {
        type: mongoose.Types.ObjectId,
        ref: "Cart"
    },
    reader: {
        type: mongoose.Types.ObjectId,
        ref: "Cart"
    },
    total_spent: {
        type: Number,
        ref: "Cart"
    },

    bought_books: [
        {
            id: {
                type: mongoose.Types.ObjectId,
                ref: "Book"
            },
            title: {
                type: String,
                ref: "Book"
            },
            amount: {
                type: Number,
                select: false, // Exclude 'amount' field from being selected
            },
            quantity: {
                type: Number,
                default: 0
            },
            date: {
                type: Date,
                default: new Date()
            }
        }
    ]
})

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;