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

            if (startDate >= endDate) {
                return res.status(400).send(failure("Starting date cannot be greater than ending date!"))
            }

            try {
                let existingBook = await bookModel.findOne(new mongoose.Types.ObjectId(book))
                if (!existingBook) {
                    return res.status(400).send(failure("Book not found!"))
                }
                // if the admin sets the discount for a specific book in a specific branch
                const matchedBranches = existingBook.branch.map((bookBranch) => bookBranch === branch)
                // Throw an error if there are no true values in matchedBranches
                if (!matchedBranches.some((isMatch) => isMatch)) {
                    return res.status(400).send(failure("The book is not available in the specified branch."));
                }
                // check if this specific discount already exists for the same book, branch, coupon code and discounted price
                let existingDiscount = await discountModel.findOne({ book, branch, discountPercentage, coupon })
                if (existingDiscount) {
                    return res.status(400).send(failure("You have already added this discount."))
                }
                // otherwise, add the discount. and update the discounts from books collection
                const discount = new discountModel({ book, branch, discountPercentage, coupon, startDate, endDate, onGoing: false })
                console.log(discount)
                await discount.save()

                return res.status(200).send(success("Successfully added the discount", discount))
            } catch (bsonError) {
                // Handle the BSONError and send a custom error response
                return res.status(400).send(failure("Invalid book ID. Please provide a valid book ID."));
            }
        } catch (error) {
            console.error("Error while entering book:", error);
            return res.status(500).send(failure("internal server error.", error))
        }
    }

    // Update an existing discount
    async update(req, res) {
        try {
            const { discountId, book, branch, discountPercentage, coupon, startDate, endDate } = req.body;

            // Validate discountId
            if (!mongoose.Types.ObjectId.isValid(discountId)) {
                return res.status(400).send(failure("Invalid discount ID. Please provide a valid discount ID."));
            }

            // Find the existing discount by discountId
            let existingDiscount = await discountModel.findById(discountId);

            if (!existingDiscount) {
                return res.status(400).send(failure("Discount not found."));
            }

            // Check if there is another discount with the same book, branch, discountPercentage, and coupon
            const duplicateDiscount = await discountModel.findOne({
                _id: { $ne: discountId }, // Exclude the current discount from the check
                book: existingDiscount.book,
                branch: branch,
                discountPercentage: discountPercentage,
                coupon: coupon,
            });

            if (duplicateDiscount) {
                return res.status(400).send(failure("Another discount with the same details already exists."));
            }
            // Update the discount properties
            existingDiscount.book = book
            existingDiscount.branch = branch
            existingDiscount.discountPercentage = discountPercentage;
            existingDiscount.coupon = coupon;
            existingDiscount.startDate = startDate;
            existingDiscount.endDate = endDate;

            // Save the updated discount
            await existingDiscount.save();

            return res.status(200).send(success("Discount updated successfully", existingDiscount));
        } catch (error) {
            console.error("Error while updating discount:", error);
            return res.status(500).send(failure("Internal server error.", error));
        }
    }

}

module.exports = new discountController()