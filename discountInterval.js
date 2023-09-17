const discountModel = require('./model/discount')
const bookModel = require('./model/book')

// Define a function to check and update discounts
const checkAndUpdateDiscounts = async () => {
    try {
      // Find discounts that have expired
      const now = new Date();
    //   const activeDiscounts = await discountModel.find({
    //     startDate: { $lt: now },
    //     endDate: { $gt: now },
    //   });
      const expiredDiscounts = await discountModel.find({
        endDate: { $lt: now },
        onGoing: true,
      });
  
      console.log(now)
  
      for (const expiredDiscount of expiredDiscounts) {
        // Set onGoing to false for expired discounts
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
  const intervalInMilliseconds = 10 * 1000; // 15 hours
  setInterval(checkAndUpdateDiscounts, intervalInMilliseconds);