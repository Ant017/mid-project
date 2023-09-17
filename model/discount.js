const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
    book: {
        type: mongoose.Types.ObjectId,
        ref: "Book",
        required: true,
    },
    branch: {
        type: String,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    coupon: {
        type: String,
        required: [true, "Add a coupon code"]
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    onGoing: {
        type: Boolean
    }
});

const Discount = mongoose.model("Discount", discountSchema);

module.exports = Discount;