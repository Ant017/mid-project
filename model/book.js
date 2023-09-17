const mongoose = require("mongoose")

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title should be provided"],
        maxLength: 100
    },
    author: {
        type: String,
        required: [true, "Author name should be provided"]
    },
    genre: {
        type: [String],
    },
    pages: {
        type: Number,
    },
    price: {
        type: Number,
        required: [true, "Price should be provided"]
    },
    stock: {
        type: Number,
        required: [true, "Stock should be provided"]
    },
    branch: {
        type: [String],
    },
    reviews: {
        type: [mongoose.Types.ObjectId],
        ref: "Review"
    },
    rating: {
        type: Number,
    },
    discounts: {
        type: [mongoose.Types.ObjectId],
        ref: "Discount"
    }
})

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;