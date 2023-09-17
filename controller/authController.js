const authModel = require('../model/auth')
const readerModel = require('../model/reader')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const HTTP_STATUS = require("../constants/statusCode");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const fs = require('fs')
const randomString = require('randomstring')

class AuthController {

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

    // refresh token
    async refresh(req, res) {
        try {
            const { reader_email } = req.body
            const emailExists = await authModel.findOne({ reader_email })

            if (emailExists) {
                console.log("yes")
                const secretKey = process.env.JWT_SECRET
                const newSecretKey = randomString.generate()

                fs.readFile("./.env", "utf-8", (err, data) => {
                    if (err) throw err

                    var newValue = data.replace(new RegExp(secretKey, "g"), newSecretKey)

                    fs.writeFile("./.env", newValue, "utf-8", (err, data) => {
                        if (err) throw err
                        console.log("Done!")
                    })
                })

                const newToken = jwt.sign({ reader_email }, process.env.JWT_SECRET, { expiresIn: '1h' })
                const response = {
                    reader_email: reader_email,
                    token: newToken
                }
                return res.status(200).send(success("Refresh successful", response))
            }
            else {
                return res.status(500).send(failure("This email does not exist."))
            }
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(500).send(failure("Token is invalid", error))
            }
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(500).send(failure("Token is expired", error))
            }
            return res.status(500).send(failure("Internal server error in refresh", error))
        }
    }

    // login
    async login(req, res) {
        try {
            const { reader_email, password } = req.body
            const auth = await authModel.findOne({ reader_email }).populate("reader")

            if (!auth) {
                return res.status(500).send(failure("Reader is not registered"))
            }

            const currentTime = new Date()
            // the future time when a user can log in again is saved in timeToLogin which is 15 seconds following the last updateAt value.
            const timeToLogin = new Date(auth.updatedAt.getTime() + 15 * 1000);
            if (auth.loginAttempt >= 3) {
                console.log("Too many failed login attempts. Try again in " + (timeToLogin - currentTime) / 1000 + " seconds")
                if ((timeToLogin - currentTime) / 1000 <= 0) {
                    auth.loginAttempt = 0;
                    await auth.save();
                }
                return res.status(401).send(failure(`Too many login attempts. Try again in ${(timeToLogin - currentTime) / 1000} seconds.`));
            }
            // if user tries to log in with wrong password, the loginAttempt property will increase 
            auth.loginAttempt++
            await auth.save()

            const checkPassword = await bcrypt.compare(password, auth.password)
            console.log(checkPassword)

            if (!checkPassword) {
                return res.status(500).send(failure("Authentication failed"))
            }

            // If the password is right, the loginAttempt property will be 0
            auth.loginAttempt = 0;
            await auth.save();

            const responseAuth = auth.toObject()
            console.log(responseAuth)

            delete responseAuth.password
            delete responseAuth._id
            // delete responseAuth.reader._id
            delete responseAuth.loginAttempt
            delete responseAuth.createdAt
            delete responseAuth.updatedAt

            const generatedToken = jwt.sign(responseAuth, process.env.JWT_SECRET, {
                expiresIn: "1h"
            })

            responseAuth.token = generatedToken

            return res.status(200).send(success("Login successful", responseAuth))
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(500).send(failure("Token is invalid", error))
            }
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(500).send(failure("Token is expired", error))
            }
            return res.status(500).send(failure("Internal server error", error))
        }
    }

    // sign up
    async signup(req, res) {
        try {
            const validation = validationResult(req).array()
            if (validation.length > 0) {
                console.log("validation error", validation)
                return res.status(500).send(failure("Failed to add the user", validation))
            }

            const { reader_name, reader_email, password, status } = req.body
            const hashedPassword = await bcrypt.hash(password, 10).then((hash) => {
                return hash
            })

            const readerInfo = await readerModel.create({
                reader_name: reader_name,
                reader_email: reader_email,
                status: status,
            })

            const result = await authModel.create({
                reader_name: reader_name,
                reader_email: reader_email,
                password: hashedPassword,
                reader: readerInfo._id
            })

            console.log(result)
            return res.status(200).send(success("Successfully added the user"))
        } catch (error) {
            console.log("Error")
            return res.status(500).send(failure("Internal server error", error))
        }
    }
}

module.exports = new AuthController()