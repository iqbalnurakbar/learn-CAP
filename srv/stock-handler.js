export default function StockHandler(srv) {
  // * Import the Books and Orders entity from the 'bookstore.inventory.system' service
  const { Books } = cds.entities("bookstore.inventory.system");
  
  /**
   * * HELPER FUNCTION: Validate book ID and quantity
   * * - Ensures both bookID and quantity are present and valid
   * * - Returns a request error if validation fails
   */
  function validateInput(bookID, quantity, req) {
    if (!bookID) return req.error(400, `Book ID is required`);
    if (!quantity || quantity <= 0)
      return req.error(400, `Quantity must be a positive number`);
  }

  /**
   * * HELPER FUNCTION: Fetch book stock by ID
   * * - Retrieves the book record from the database with ID and current stock
   */
  async function getBookStock(bookID) {
    return await SELECT.one.from(Books, bookID).columns("ID", "stock");
  }

  /**
   * * HELPER FUNCTION: Update book stock
   * * - Handles both increasing and decreasing stock
   * * - If decreasing, only updates when current stock is sufficient
   * * - Returns updated stock or meaningful error messages
   * @param {string} bookID - ID of the book to update
   * @param {number} quantity - Amount to change the stock by
   * @param {object} req - Request context (used for error handling)
   * @param {boolean} isDecreased - Whether to decrease (true) or increase (false) stock
   */
  async function updateStock(bookID, quantity, req, isDecreased) {
    // Choose the operator based on whether we are increasing or decreasing stock
    const operator = isDecreased ? "-=" : "+=";

    // Attempt to update stock
    const updated = await UPDATE(Books, bookID)
      .with({
        stock: { [operator]: quantity },
      })
      .where(isDecreased ? { stock: { ">=": quantity } } : {}); // Only restrict if decreasing

    // If no records updated, determine cause
    if (updated === 0) {
      const book = await getBookStock(bookID);

      if (!book) {
        // Book not found in the system
        return req.error(404, `Book with ID ${bookID} not found!`);
      }

      if (isDecreased) {
        // Book found but not enough stock to fulfill request
        return req.error(
          409,
          `Only ${book.stock} items left, but requested ${quantity}!`
        );
      }
    }

    // Fetch updated stock data to return in response
    const updatedStock = await getBookStock(bookID);

    return {
      success: true,
      ID: updatedStock.ID,
      stock: updatedStock.stock,
    };
  }

  /**
   * * Event Handler: Decrease stock of a book
   * * - Validates input
   * * - Attempts to decrease stock if available
   * * - Returns updated stock or appropriate error
   */
  srv.on("decreasedStock", async (req) => {
    const { book: bookID, quantity } = req.data;

    // Validate input
    const validation = validateInput(bookID, quantity, req);
    if (validation) return validation;

    try {
      // Attempt to decrease stock
      return await updateStock(bookID, quantity, req, true);
    } catch (error) {
      // Unexpected failure
      req.error(500, `failed ${error.message}`);
    }
  });

  /**
   * * Event Handler: Increase stock of a book
   * * - Validates input
   * * - Increases stock without precondition
   * * - Returns updated stock or appropriate error
   */
  srv.on("increasedStock", async (req) => {
    const { book: bookID, quantity } = req.data;

    // Validate input
    const validation = validateInput(bookID, quantity, req);
    if (validation) return validation;

    // * Import the Books and Orders entity from the 'bookstore.inventory.system' service
    const { Books } = cds.entities("bookstore.inventory.system");

    try {
      // Attempt to increase stock
      return await updateStock(bookID, quantity, req, false);
    } catch (error) {
      // Unexpected failure
      req.error(500, `failed ${error.message}`);
    }
  });
}
