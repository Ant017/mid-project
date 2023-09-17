const { success, failure } = require("../utils/success-error")
const fs = require("fs")

const logs = (req, res, next) => {
    const formattedDate = new Date().toLocaleString();

    try {

        // Create a log message with the timestamp
        const logMessage = `Request timestamp: ${formattedDate}, Method: ${req.method}, URL: ${req.url}\n`;

        // Append the log message to the log file
        fs.appendFileSync("./logFile.log", logMessage);
        next()
    } catch (error) {
        const logMessage = `Request timestamp: ${formattedDate}, Error: ${error}\n`;

        // Append the log message to the log file
        fs.appendFileSync("./logFile.log", logMessage);
        console.log(error)
        return res.status(500).send(failure("Internal server error for log.", error))
    }
}


module.exports = logs