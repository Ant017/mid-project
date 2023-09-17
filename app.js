const express = require('express')
const discountModel = require('./model/discount')
const bookModel = require('./model/book')
const bookshopRouter = require('./routes/bookshopRoutes')
const cors = require("cors")
const databaseConnection = require('./config/database')
const dotenv = require('dotenv')
dotenv.config()

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).send({ message: "Invalid JSON syntax!" })
  }
  next()
})

// Define a function to check and update discounts
const checkAndUpdateDiscounts = async () => {
  try {
    // Find discounts that have expired
    const now = new Date();
    console.log(now)

    // Find upcoming discounts with onGoing set to false
    const upcomingDiscounts = await discountModel.find({
      startDate: { $gt: now },
      onGoing: false
    });

    // console.log("upcoming", upcomingDiscounts)

    // Activate upcoming discounts
    for (const upcomingDiscount of upcomingDiscounts) {
      upcomingDiscount.onGoing = true;
      await upcomingDiscount.save();

      // Update the associated book document to add the discount ID
      const book = await bookModel.findById(upcomingDiscount.book);
      if (book) {
        book.discounts.push(upcomingDiscount._id);
        await book.save();
      }
    }

    // Find discounts that have expired
    const expiredDiscounts = await discountModel.find({
      endDate: { $lt: now },
      onGoing: true,
    });

    // console.log("expiry", expiredDiscounts)

    // Deactivate expired discounts
    for (const expiredDiscount of expiredDiscounts) {
      expiredDiscount.onGoing = false;
      await expiredDiscount.save();

      // Update the associated book document to remove the discount ID
      const book = await bookModel.findById(expiredDiscount.book);
      if (book) {
        book.discounts.pull(expiredDiscount._id);
        await book.save();
      }
    }
  } catch (error) {
    console.error('Error checking and updating discounts:', error);
  }
};

// Call the function initially and then at regular intervals
checkAndUpdateDiscounts(); // Call immediately when your application starts

// Set up the interval to periodically check and update discounts (e.g., every 24 hours)
const intervalInMilliseconds = 15 * 1000; // 15 hours
setInterval(checkAndUpdateDiscounts, intervalInMilliseconds);


app.use("/shop", bookshopRouter)

// using route() method to get the invalid routes
app.route('*')
  .get((req, res) => {
    res.status(400).send("Invalid route!")
  })
  .put((req, res) => {
    res.status(400).send("Invalid route!")
  })
  .post((req, res) => {
    res.status(400).send("Invalid route!")
  })
  .delete((req, res) => {
    res.status(400).send("Invalid route!")
  })

databaseConnection(() => {
  app.listen(8000, () => {
    // console.log(process.env.JWT_SECRET)
    console.log("Server is running on 8000...")
  })
})

