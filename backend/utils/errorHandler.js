/**
 * Error Handler Class | Captures errors and manages them in a consistent manner
 */
class ErrorHandler extends Error {

  /**
   * @constructor
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode

    // For understand origin of error
    Error.captureStackTrace(this, this.constructor)
  }

}

module.exports = ErrorHandler;