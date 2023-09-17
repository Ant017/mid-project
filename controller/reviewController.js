const bookModel = require('../model/book')
const readerModel = require('../model/reader')
const reviewModel = require('../model/review')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

class reviewClass {
    //add data
    async add(req, res) {
        try {
            const { book, reader, rating, text } = req.body

            let existingBook = await bookModel.findById(new mongoose.Types.ObjectId(book))
            let existingReader = await readerModel.findById(new mongoose.Types.ObjectId(reader))
            const existingReview = await reviewModel.findOne({ book, reader })

            if (existingReview) {
                return res.status(400).send(failure("You have already added a review for this book. Please update it."))
            }
            if ((!existingBook && !existingReader) || (!existingBook && existingReader) || (existingBook && !existingReader)) {
                return res.status(400).send(failure("Please provide a valid book or/and reader id."))
            }
            else {
                const review = new reviewModel({ book, reader, rating, text })

                await review.save()
                // Update the book's rating and get the new average rating
                const reviews = await reviewModel.find({ book, rating: { $exists: true } }); // Only consider reviews with a rating property
                let totalRating = 0;
                let numberOfReviewsWithRatings = 0;

                for (const rev of reviews) {
                    totalRating += rev.rating;
                    numberOfReviewsWithRatings++;
                }

                // to avoid divide by zero error
                const averageRating = numberOfReviewsWithRatings > 0 ? totalRating / numberOfReviewsWithRatings : 0;

                // Update the book's rating
                await bookModel.findByIdAndUpdate(book, {
                    rating: averageRating,
                    $push: { reviews: review._id } // Add the review ID to the reviews array
                });

                console.log(`Average rating updated for book ${book} to ${averageRating}`)

                return res.status(200).send(success("Successfully added the review", review))
            }

        } catch (error) {
            console.error("Error while entering review:", error);
            return res.status(500).send(failure("internal server error.", error))
        }
    }

    // remove rating
    async updateReview(req, res) {
        try {
            const { authorization } = req.headers
            const { book, rating, text } = req.body

            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })

            const readerIdFromToken = decodedToken.payload.reader._id
            const existingReview = await reviewModel.findOne({ reader: readerIdFromToken, book: book })

            // Check if the review exists
            if (!existingReview) {
                return res.status(400).send(failure("Review not found."));
            }


            // // if the rating is already removed by the reader
            // if (existingReview.rating === undefined && existingReview.text === undefined) {
            //     return res.status(400).send(failure("You already removed the rating and the review."))
            // }

            if (existingReview) {
                existingReview.rating = rating
                existingReview.text = text
                await existingReview.save()

                // Update the book's rating and get the new average rating
                // const reviews = await reviewModel.find({ book });
                let totalRating = 0;

                for (const rev of reviews) {
                    totalRating += rev.rating;
                }

                const averageRating = totalRating / reviews.length

                // Update the book's rating
                await bookModel.findByIdAndUpdate(book, {
                    rating: averageRating,
                    $push: { reviews: review._id } // Add the review ID to the reviews array
                });

                console.log(`Average rating updated for book ${book} to ${averageRating}`)
                return res.status(200).send(success("Updated the review.", existingReview))
            }


            else {
                return res.status(400).send(failure("The reader has not made any transactions."))
            }

        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error", error))
        }
    }

    // //remove review text
    // async removeReviewText(req, res) {
    //     try {
    //         const { authorization } = req.headers
    //         const { book } = req.body

    //         const token = authorization.split(' ')[1]
    //         const decodedToken = jwt.decode(token, { complete: true })

    //         const readerIdFromToken = decodedToken.payload.reader._id
    //         try {
    //             const existingReview = await reviewModel.findOne({ reader: readerIdFromToken, book: book })

    //             console.log(existingReview)
    //             // Check if the review exists
    //             if (!existingReview) {
    //                 return res.status(400).send(failure("The reader has not made any reviews."));
    //             }
    //             // if the rating is already removed by the reader
    //             if (!existingReview.text) {
    //                 return res.status(400).send(failure("You already removed the review text."))
    //             }

    //             // removing the rating and changing it to 0.
    //             if (existingReview.text) {
    //                 existingReview.text = '';
    //                 await existingReview.save()
    //                 return res.status(200).send(success("Removed the rating.", existingReview))
    //             }
    //             else {
    //                 return res.status(400).send(failure("The reader has not made any transactions."))
    //             }
    //         } catch (bsonError) {
    //             // Handle the BSONError and send a custom error response
    //             return res.status(400).send(failure("Invalid book ID. Please provide a valid book ID."));
    //         }


    //     } catch (error) {
    //         console.log("error found", error)
    //         res.status(500).send(failure("Internal server error", error))
    //     }
    // }

}

module.exports = new reviewClass()