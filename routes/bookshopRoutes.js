const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const { checkLogin, isAdmin, isVerified } = require('../middleware/auth')
const logs = require('../middleware/log')
const AuthController = require('../controller/authController')
const readerController = require('../controller/readerController')
const bookController = require("../controller/bookController")
const cartController = require("../controller/CartController")
const authController = require('../controller/authController')
const reviewController = require('../controller/reviewController')
const Auth = require('../model/auth')
const discountController = require('../controller/discountController')

routes.post("/signup", readerValidation.signup, AuthController.create, logs, AuthController.signup)
routes.post("/login", AuthController.login)
routes.post("/refresh", checkLogin, logs, authController.refresh)

routes.post("/add-book", checkLogin, isAdmin, logs, bookController.add)
routes.get("/get-all-books", logs, bookController.getAll)
routes.get("/get-book-by-id/:id", logs, bookController.getOneById)
routes.delete("/del-book-by-id/:id", checkLogin, isAdmin, logs, bookController.deleteOneById)

routes.post("/add-reader", readerValidation.create, readerController.create, logs, readerController.add)

routes.post("/add-to-cart", isVerified, logs, cartController.add) //OK
routes.patch("/delete-from-cart", isVerified, logs, cartController.delete) //OK
routes.post("/checkout", isVerified, logs, cartController.checkOut)
routes.get("/get-all-cart", logs, cartController.getAll)
routes.get("/show-my-cart", checkLogin, isVerified, logs, cartController.showCart)
routes.get("/show-my-transaction", checkLogin, isVerified, logs, cartController.showTransaction)

routes.get("/get-transaction", logs, cartController.getAll)

routes.post("/add-review", isVerified, logs, reviewController.add)
routes.put("/update-review", checkLogin, isVerified, logs, reviewController.updateReview)

routes.post("/add-discount", checkLogin, isAdmin, logs, discountController.add)

module.exports = routes