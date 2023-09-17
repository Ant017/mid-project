const { body } = require("express-validator")

const validator = {
    create: [
        body("reader_name")
            .isString()
            .withMessage("Name must be a string.")
            .custom((value) => {
                if (value === "Unknown") {
                    throw new Error("Name cannot be unknown")
                }
                return true
            }),

        body("reader_email")
            .isString()
            .withMessage("email must be a string.")
            .bail()
            .isEmail()
            .withMessage("This is not a valid email id"),
    ],
    signup: [
        body("reader_name")
            .isString()
            .withMessage("Name must be a string.")
            .custom((value) => {
                if (value === "Unknown") {
                    throw new Error("Name cannot be unknown")
                }
                return true
            }),
        body("reader_email")
            .isString()
            .withMessage("email must be a string.")
            .bail()
            .isEmail()
            .withMessage("This is not a valid email id"),

        body("password")
            .custom((value, { req }) => {
                if (value.length < 8) {
                    throw new Error("Password must be longer than 8 characters.")
                }
                const name = req.body.reader_name.toLowerCase()
                if (value.toLowerCase().includes(name)) {
                    throw new Error("Password cannot contain parts of your name.")
                }
                const checkCapitalLetter = /[A-Z]+/
                const checkNumber = /[0-9]+/
                const checkSpecialChar = /[*@!#%&()^~{}]+/

                if (!checkCapitalLetter.test(value) || !checkNumber.test(value) || !checkSpecialChar.test(value)) {
                    throw new Error("Passowrd must contain at least one special character, one Capital letter and one number.")
                }
                return true
            }),
    ]
}

module.exports = validator

// const { success, failure } = require("../utils/success-error")
// const express = require('express')
// const manga = require("../model/mangaModel")

// const app = express()
// app.use(express.json())

// // Validation fucntion for adding and update
// const validationFunc = (req, res, next) => {
//     const { name, price, stock, author } = req.body
//     const errors = {}
//     if (!name || name === "") {
//         errors.name = "Name is not provided"
//     }
//     if (!price || price === "" || price > 1000) {
//         errors.price =
//             "Price should be provided, and it should be less than 1000."
//     }
//     if (!stock || stock === "" || stock === 0) {
//         errors.stock =
//             "Stock should be provided, and it should be greater than 0."
//     }
//     if (!author || author === "" || author === "Unknown") {
//         errors.author =
//             "Author name should be provided, and it should not be unknown."
//     }
//     if (Object.keys(errors).length > 0) {
//         res.status(500).send(failure(success, errors))
//     }
//     if (Object.keys(errors).length === 0) {
//         next()
//     }
// }

// module.exports = validationFunc