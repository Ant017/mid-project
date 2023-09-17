const bookModel = require('../model/book')
const reviewModel = require('../model/review')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')

class bookController {

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
            return res.status(500).send(failure("internal server error.", error))
        }
    }

    //add data
    async add(req, res) {
        try {
            const { title, author, genre, pages, price, stock, branch } = req.body

            let existingBook = await bookModel.findOne({ title, author })
            if (existingBook) {
                return res.status(500).send(failure("This book already exists!"))
            }
            else {
                const book = new bookModel({ title, author, genre, pages, price, stock, branch })
                console.log(book)
                await book.save()

                return res.status(200).send(success("Successfully added the book"))
            }
        } catch (error) {
            console.error("Error while entering book:", error);
            return res.status(500).send(failure("internal server error.", error))
        }
    }

    //get all data
    async getAll(req, res) {
        try {
            let { page, limit, sortParam, sortOrder, pagesMin, pagesMax, priceMin, priceMax, stockMin, stockMax, search } = req.query

            let result = 0
            // Total number of records in the whole collection
            const totalRecords = await bookModel.countDocuments({})

            if (!page || !limit) {
                page = 1
                limit = totalRecords / page
            }

            if (page < 1 || limit < 0) {
                return res.status(500).send(failure("Page must be at least 1 and limit must be at least 0"))
            }

            // sorting
            if (
                (sortParam && !sortOrder) ||
                (!sortParam && sortOrder) ||
                (sortParam && sortParam !== "pages" && sortParam !== "price" && sortParam !== "stock") ||
                (sortOrder && sortOrder !== "asc" && sortOrder !== "desc")
            ) {
                return res.status(400).send(failure("Invalid sort parameters provided."));
            }

            // Filtering
            const filter = {}
            if (priceMin && priceMax) {
                if (priceMin > priceMax) {
                    return res.status(400).send(failure("Minimum price cannot be greater than maximum price."));
                }
                filter.price = {
                    $gte: parseFloat(priceMin),
                    $lte: parseFloat(priceMax)
                }

            }
            if (priceMin && !priceMax) {
                filter.price = { $gte: parseFloat(priceMin) }

            }
            if (!priceMin && priceMax) {
                filter.price = { $lte: parseFloat(priceMax) }

            }
            if (pagesMin && pagesMax) {
                if (pagesMin > pagesMax) {
                    return res.status(400).send(failure("Minimum pages cannot be greater than maximum pages."));
                }
                filter.pages = {
                    $gte: parseFloat(pagesMin),
                    $lte: parseFloat(pagesMax)
                }

            }
            if (pagesMin && !pagesMax) {
                filter.pages = { $gte: parseFloat(pagesMin) }

            }
            if (!pagesMin && pagesMax) {
                filter.pages = { $lte: parseFloat(pagesMax) }

            }
            if (stockMin && stockMax) {
                if (stockMin > stockMax) {
                    return res.status(400).send(failure("Minimum stock cannot be greater than maximum stock."));
                }
                filter.stock = {
                    $gte: parseFloat(stockMin),
                    $lte: parseFloat(stockMax)
                }

            }
            if (stockMin && !stockMax) {
                filter.stock = { $gte: parseFloat(stockMin) }

            }
            if (!stockMin && stockMax) {
                filter.stock = { $lte: parseFloat(stockMax) }

            }

            // search
            if (search) {
                filter["$or"] = [
                    { title: { $regex: search, $options: "i" } },
                    { author: { $regex: search, $options: "i" } },
                    { genre: { $regex: search, $options: "i" } }
                ];
            }

            // Pagination
            result = await bookModel.find(filter)
                .sort({
                    [sortParam]: sortOrder === "asc" ? 1 : -1,
                })
                .skip((page - 1) * limit)
                .limit(limit)


            if (result.length > 0) {
                const paginationResult = {
                    reader: result,
                    totalInCurrentPage: result.length,
                    currentPage: parseInt(page),
                    totalRecords: totalRecords
                }
                return res
                    .status(200)
                    .send(success("Successfully received all books", paginationResult));
            }
            return res.status(500).send(success("No book was found"));

        } catch (error) {
            return res.status(500).send(failure("internal server error.", error.message))
        }
    }

    //get one data by id
    async getOneById(req, res) {
        try {
            const { id } = req.params;
            const result = await bookModel.findById({ _id: id })
                .populate({
                    path: "reviews",
                    populate: {
                        path: "reader",
                        model: "Reader",
                        select: "reader_name",
                    },
                    select: "rating text",
                });
            console.log(result)
            if (result) {
                res.status(200).send(success("Successfully received the book", result))
            } else {
                res.status(200).send(failure("Can't find the book"))
            }

        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error"))
        }
    }

    //delete data by id
    async deleteOneById(req, res) {
        try {
            const { id } = req.params;
            console.log(id);
            const result = await bookModel.findOneAndDelete({ _id: id })
            if (result) {
                res.status(200).send(success("Successfully deleted the book", result))
            } else {
                res.status(200).send(failure("Can't find the book"))
            }

        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error", error))
        }
    }

    // //updatedatabyid
    // async updateOneById(req, res) {
    //     try {
    //         // const { reader_name, reader_email, read } = req.body
    //         const { id } = req.params; // Retrieve the id from req.params
    //         // console.log(id);
    //         const options = { upsert: true };
    //         const result = await bookModel.findByIdAndUpdate(id, req.body, options);
    //         // console.log(result)
    //         if (result) {
    //             res.status(200).send(success("Successfully updated the reader", result))
    //         } else {
    //             res.status(200).send(failure("Can't find the reader"))
    //         }

    //     } catch (error) {
    //         console.log("error found", error)
    //         res.status(500).send(failure("Internal server error"))
    //     }
    // }
}

module.exports = new bookController()