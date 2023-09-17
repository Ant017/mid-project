const bookModel = require('../model/book')
const readerModel = require('../model/reader')
const cartModel = require('../model/cart')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const mongoose = require("mongoose")
const orderModel = require('../model/order')
const jwt = require("jsonwebtoken")

class transactionController {

    // validation
    async create(req, res, next) {
        try {
            const validation = validationResult(req).array()
            if (validation.length > 0) {
                return res.status(422).send({ message: "validation error", validation })
            }
            else {
                next()
            }
        } catch (error) {
            console.log("error has occured")
        }
    }

    //add to cart
    async add(req, res) {
        try {
            const { reader, bought_books } = req.body

            // if reader id and book id is not provided
            if (!reader || !bought_books) {
                return res.status(500).send(failure("Provide reader id and book id"))
            }

            if (bought_books.amount === 0) {
                return res.status(500).send(failure("Amount cannot be 0."))
            }

            let totalSpent = 0
            let existingTransaction = await cartModel.findOne({ reader });

            if (existingTransaction) {
                // finding the index of the book in the array
                let existingBookEntryIndex = -1
                existingTransaction.bought_books.map(
                    (entry, i) => {
                        if (String(entry.id) === req.body.bought_books.id) {
                            existingBookEntryIndex = i
                        }
                    }
                );

                if (existingBookEntryIndex >= 0) {
                    //increase quantity
                    console.log("increase quantity")
                    existingTransaction.bought_books[existingBookEntryIndex].quantity += bought_books.amount
                }
                else {
                    // enter new object inside the array
                    console.log("entering new book for existing user")
                    console.log(bought_books.amount)
                    existingTransaction.bought_books.push({
                        id: new mongoose.Types.ObjectId(bought_books.id),
                        quantity: bought_books.amount
                    })
                }
            }
            else {
                // if reader is not already in the cart schema, create new
                existingTransaction = new cartModel({
                    reader,
                    bought_books: [{
                        id: new mongoose.Types.ObjectId(bought_books.id),
                        quantity: bought_books.amount // Set quantity explicitly
                    }]
                })
            }

            // Calculate total price for this transaction
            for (const book of existingTransaction.bought_books) {
                const bookData = await bookModel.findById(book.id);

                if (!bookData) {
                    return res.status(400).send(failure("Book not found"));
                }

                totalSpent += bookData.price * book.quantity;
                if (bookData.stock - book.quantity <= 0) {
                    return res.status(400).send(failure("Sorry, low stock!"));
                }
            }

            // Update the total_spent field
            existingTransaction.total_spent = totalSpent;
            await existingTransaction.save();

            return res.status(200).send(success("Successfully added to the cart", existingTransaction))
        } catch (error) {
            console.error("Error while adding to cart:", error);
            return res.status(500).send(failure("Internal server error"))
        }
    }

    async delete(req, res) {
        try {
            const { reader, bought_books } = req.body
            if (!reader || !bought_books) {
                return res.status(500).send(failure("Provide reader id and book id"))
            }

            if (bought_books.amount === 0) {
                return res.status(500).send(failure("Amount cannot be 0."))
            }

            let totalSpent = 0
            let existingTransaction = await cartModel.findOne({ reader });

            if (existingTransaction) {
                let existingBookEntryIndex = -1
                existingTransaction.bought_books.map(
                    (entry, i) => {
                        if (String(entry.id) === req.body.bought_books.id) {
                            existingBookEntryIndex = i
                        }
                    }
                );

                if (existingBookEntryIndex >= 0) {
                    //increase quantity
                    console.log("increase quantity")

                    let quantity_ = existingTransaction.bought_books[existingBookEntryIndex].quantity
                    console.log(quantity_)

                    // if delete amount is more than quantity, it will throw error
                    if (bought_books.amount > quantity_) {
                        return res.status(400).send(failure("Delete amount cannot be more than quantity."));
                    }

                    quantity_ -= bought_books.amount
                    existingTransaction.bought_books[existingBookEntryIndex].quantity = quantity_

                    // if quantity is 0 but bought_book length is not, i am removing the object from the array
                    if (quantity_ === 0) {
                        existingTransaction.bought_books.splice(existingBookEntryIndex, 1);
                        await existingTransaction.save()
                    }
                }
                else {
                    console.log("entering new book for existing user")
                    existingTransaction.bought_books.push({ id: new mongoose.Types.ObjectId(bought_books.id) })
                }
            }
            else {
                existingTransaction = new cartModel({ reader, bought_books })
            }

            // Calculate the total spent for this transaction
            for (const book of existingTransaction.bought_books) {
                const bookData = await bookModel.findById(book.id);
                if (!bookData) {
                    return res.status(400).send(failure("Book with ID ${book.title} not found"));
                }

                totalSpent += bookData.price * book.quantity;
            }

            // Update the total_spent field
            existingTransaction.total_spent = totalSpent;

            await existingTransaction.save();

            return res.status(200).send(success("Successfully deleted from cart", existingTransaction))
        } catch (error) {
            console.error("Error while deleting transaction:", error);
            return res.status(500).send(failure("Internal server error"))
        }
    }

    async getAll(req, res) {
        try {
            const result = await cartModel.aggregate({
                $group: {
                    _id: false,
                    total: { $sum: "$total_spent" }
                }
            })
            console.log(result)
            return res.status(200).send(success("Successfully got all from cart", result))
        }
        catch (error) {
            console.error("Error while getting data from cart:", error);
            return res.status(500).send(failure("Internal server error"))
        }
    }

    //get the reader's cart
    async showCart(req, res) {
        try {
            const { authorization } = req.headers

            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })

            const readerIdFromToken = decodedToken.payload.reader._id
            console.log("this is from the cart controller", readerIdFromToken)
            const existingCart = await cartModel.findOne({ reader: readerIdFromToken })

            if(existingCart) {
                res.status(200).send(success("Got the data from the cart", existingCart))
            }
            else {
            res.status(400).send(failure("This cart does not exist."))
            }

        } catch (error) {
            console.log("error found", error)
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(500).send(failure("Token is invalid", error))
            }
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(500).send(failure("Token is expired", error))
            }
            res.status(500).send(failure("Internal server error"))
        }
    }

    // checkout
    async checkOut(req, res) {
        try {
            const { cart } = req.body

            // if there is nothing in the body
            if (!cart) {
                return res.status(500).send(failure("Provide a cart id"))
            }

            let existingCart = await cartModel.findById(new mongoose.Types.ObjectId(cart))
            if (existingCart) {
                // cart exists but the array is empty
                if (existingCart.bought_books.length === 0) {
                    return res.status(500).send(failure("Cart does not exist."))
                }

                // Calculate the price for this transaction
                for (const book of existingCart.bought_books) {
                    const bookData = await bookModel.findById(book.id);
                    if (!bookData) {
                        return res.status(400).send(failure("Book not found"));
                    }

                    let updateStock = bookData.stock

                    if (updateStock - book.quantity <= 0) {
                        return res.status(400).send(failure("Sorry, low stock!"));
                    }
                    bookData.stock -= book.quantity

                    await bookData.save();
                }
                const totalSpent = existingCart.total_spent
                const reader = existingCart.reader

                // adding to the order schema
                const orderInfo = await orderModel.create({
                    cart: cart,
                    reader: reader,
                    total_spent: totalSpent,
                    bought_books: existingCart.bought_books
                })

                // deleting the cart from cart schema
                await cartModel.findOneAndDelete(new mongoose.Types.ObjectId(cart))
                return res.status(200).send(success("Successfully checked out from cart", existingCart))
            }
            else {
                return res.status(500).send(failure("cart does not exist"))
            }

        } catch (error) {
            console.error("Error while checking out:", error);
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(500).send(failure("Token is invalid", error))
            }
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(500).send(failure("Token is expired", error))
            }
            return res.status(500).send(failure("Internal server error"))
        }
    }

    //show reader's transactions
    async showTransaction(req, res) {
        try {
            const { authorization } = req.headers

            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })

            const readerIdFromToken = decodedToken.payload.reader._id
            console.log("this is from the cart controller", readerIdFromToken)
            const existingTransaction = await orderModel.findOne({ reader: readerIdFromToken })

            // console.log(existingTransaction)
            if (existingTransaction) {
                res.status(200).send(success("Got the data from transaction.", existingTransaction))
            }
            else {
                res.status(400).send(failure("The reader has not made any transactions."))
            }

        } catch (error) {
            console.log("error found", error)
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(500).send(failure("Token is invalid", error))
            }
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(500).send(failure("Token is expired", error))
            }
            res.status(500).send(failure("Internal server error"))
        }
    }

    //get all data
    async getAll(req, res) {
        try {
            // console.log(req.name)
            const result = await cartModel.find({})
                .populate("reader", "-password")
                .populate("bought_books.id")
            console.log(result)
            if (result.length > 0) {
                return res
                    .status(200)
                    .send(success("Successfully received all transactions", result));
            }
            return res.status(500).send(success("No transactions were found"));

        } catch (error) {
            res.status(500).send(failure(error.message))
        }
    }

    //     //get one data by id
    //     async getOneById(req, res) {
    //         try {
    //             const { id } = req.params; // Retrieve the id from req.params
    //             // console.log(id);
    //             const result = await bookModel.findById({ _id: id })
    //             // console.log(result)
    //             if (result) {
    //                 res.status(200).send(success("Successfully received the reader", result))
    //             } else {
    //                 res.status(200).send(failure("Can't find the reader"))
    //             }

    //         } catch (error) {
    //             console.log("error found", error)
    //             res.status(500).send(failure("Internal server error"))
    //         }
    //     }
}

module.exports = new transactionController()