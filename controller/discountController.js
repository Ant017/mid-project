const { default: mongoose } = require('mongoose')
const bookModel = require('../model/book')
const reviewModel = require('../model/review')
const discountModel = require('../model/discount')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')

class discountController {

    //add discount
    async add(req, res) {
        try {
            const { book, branch, discountPercentage, coupon, startDate, endDate } = req.body

            if (!book && !branch) {
                return res.status(400).send(failure("Please provide book id and/or branch name!"))
            }

            try {
                let existingBook = await bookModel.findOne(new mongoose.Types.ObjectId(book))
                if (!existingBook) {
                    return res.status(400).send(failure("Book not found!"))
                }
                else {
                    // if the admin sets the discount for a specific book in a specific branch
                    if (book && branch) {
                        const matchedBranches = existingBook.branch.map((bookBranch) => bookBranch === branch)
                        // Throw an error if there are no true values in matchedBranches
                        if (!matchedBranches.some((isMatch) => isMatch)) {
                            return res.status(400).send(failure("The book is not available in the specified branch."));
                        }
                        // otherwise, add the discount. and update the discounts from books collection
                        else {
                            // check if this specific discount already exists for the same book, branch, coupon code and discounted price
                            let existingDiscount = await discountModel.findOne({ book, branch, discountPercentage, coupon })
                            if (existingDiscount) {
                                return res.status(400).send(failure("You have already added this discount."))
                            }
                            const discount = new discountModel({ book, branch, discountPercentage, coupon, startDate, endDate, onGoing: false })
                            console.log(discount)
                            await discount.save()

                            existingBook.discounts.push(discount._id);
                            await existingBook.save();

                            return res.status(200).send(success("Successfully added the dsicount", discount))
                        }
                    }
                }
            } catch (bsonError) {
                // Handle the BSONError and send a custom error response
                return res.status(400).send(failure("Invalid book ID. Please provide a valid book ID."));
            }
        } catch (error) {
            console.error("Error while entering book:", error);
            return res.status(500).send(failure("internal server error.", error))
        }
    }
}

module.exports = new discountController()