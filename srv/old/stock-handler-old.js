// Import the Books entity from the 'bookstore.inventory.system' service definition
const { Books } = cds.entities("bookstore.inventory.system");

// Handler to decrease book stock when an order is placed
srv.on("decreasedStock", async (req) => {
  // Extract book ID and quantity from the incoming request
  const { book: bookID, quantity } = req.data;

  // Input validation: Book ID must be provided
  if (!bookID) {
    return req.error(400, `Book ID is required`);
  }

  // Input validation: Quantity must be a positive number
  if (!quantity || quantity <= 0) {
    return req.error(400, `Quantity must be a positive number`);
  }

  try {
    // Attempt to reduce the stock of the specified book by the given quantity,
    // only if the current stock is sufficient
    const fetchOrderData = await UPDATE(Books, bookID)
      .with({ stock: { "-=": quantity } })
      .where({ stock: { ">=": quantity } });

    // If no rows were updated, check why (e.g., not enough stock or book doesn't exist)
    if (fetchOrderData === 0) {
      // Try to retrieve the book to determine if it exists
      const book = await SELECT.one.from(Books, bookID).columns("stock");

      if (!book) {
        // Book not found
        return req.error(404, `Book with ID ${bookID} not found!`);
      } else {
        // Book exists but not enough stock to fulfill the request
        return req.error(
          409,
          `Only ${book.stock} items left, but requested ${quantity}!`
        );
      }
    }

    // Fetch and return the updated stock information
    const updatedStock = await SELECT.one
      .from(Books, bookID)
      .columns("ID", "stock");

    return { success: true, ID: updatedStock.ID, stock: updatedStock.stock };
  } catch (error) {
    // Catch and return any unexpected server-side errors
    req.error(500, `Failed: ${error.message}`);
  }
});

// Handler to increase book stock (e.g., returns, restocking)
srv.on("increasedStock", async (req) => {
  // Extract book ID and quantity from the incoming request
  const { book: bookID, quantity } = req.data;

  // Input validation: Book ID must be provided
  if (!bookID) {
    return req.error(400, `Book ID is required`);
  }

  // Input validation: Quantity must be a positive number
  if (!quantity || quantity <= 0) {
    return req.error(400, `Quantity must be a positive number`);
  }

  try {
    // Increase the stock of the specified book by the given quantity
    const fetchOrderData = await UPDATE(Books, bookID).with({
      stock: { "+=": quantity },
    });

    // If no rows were updated, check if the book exists
    if (fetchOrderData === 0) {
      const book = await SELECT.one.from(Books, bookID).columns("stock");

      if (!book) {
        // Book not found
        return req.error(404, `Book with ID ${bookID} not found!`);
      }
    }

    // Fetch and return the updated stock information
    const updatedStock = await SELECT.one
      .from(Books, bookID)
      .columns("ID", "stock");

    return { success: true, ID: updatedStock.ID, stock: updatedStock.stock };
  } catch (error) {
    // Catch and return any unexpected server-side errors
    req.error(500, `Failed: ${error.message}`);
  }
});
