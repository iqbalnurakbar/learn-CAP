import { v4 as uuidv4 } from "uuid";

export default function OrderHandler(srv) {
  srv.on("submitOrder", async (req) => {
    const { book: bookID, quantity } = req.data;
    if (!bookID || !quantity || quantity <= 0) {
      return req.error(400, `Invalid book ID or quantity`);
    }

    const { Orders, OrderItems, Books, Customers } = cds.entities(
      "bookstore.inventory.system"
    );
    const book = await SELECT.one.from(Books, bookID).columns("stock", "price");
    if (!book) return req.error(404, `Book not found!`);
    if (book.stock < quantity)
      return req.error(409, `Only ${book.stock} left!`);

    let customerID = req.user?.ID;

    if (!customerID) {
      customerID = uuidv4();
      await INSERT.into(Customers).entries({
        ID: customerID,
        name: "Test-001",
        email: `test001@example.com`,
        address: "N/A",
      });
    }
    // Insert order and get the ID
    const orderID = uuidv4();
    await INSERT.into(Orders).entries({
      ID: orderID,
      customer: { ID: customerID },
      status: "New",
      createdAt: new Date().toISOString(),
    });

    // Insert order item
    await INSERT.into(OrderItems).entries({
      parent_ID: orderID, // Assuming foreign key is `parent_ID`
      book_ID: bookID, // Assuming foreign key is `book_ID`
      quantity,
      price: book.price,
    });

    console.log(`Order ${orderID} created for book ${bookID}!`);
    return {
      orderID,
      status: "New",
      stock: book.stock,
    };
  });

  srv.on("processOrder", async (req) => {
    const { order: orderID } = req.data;
    const { Orders, OrderItems, Books } = cds.entities(
      "bookstore.inventory.system"
    );

    const order = await SELECT.one.from(Orders, orderID).columns("status");
    if (!order) return req.error(404, "Order not found!");
    if (order.status !== "New")
      return req.error(400, "Order already processed!");

    const items = await SELECT.from(OrderItems)
      .where({ parent_ID: orderID })
      .columns("book_ID as bookID", "quantity");

    for (const item of items) {
      await UPDATE(Books, item.bookID)
        .where({ stock: { ">=": item.quantity } })
        .set({ stock: { "-=": item.quantity } });
    }

    await UPDATE(Orders, orderID).set({ status: "Processed" });

    console.log(`Order ${orderID} processed. Stock updated!`);
    return { id: orderID, status: "Processed" };
  });

  srv.on("shipOrder", async (req) => {
    const { order: orderID } = req.data;
    const { Orders } = cds.entities("bookstore.inventory.system");
    const order = await SELECT.one.from(Orders, orderID).columns("status");
    if (!order) return req.error(404, "Order not found!");
    if (order.status !== "Processed")
      return req.error(400, "Order must be processed first!");
    await UPDATE(Orders, orderID).set({ status: "Shipped" });
    console.log(`Order ${orderID} shipped!`);
    return { ID: orderID, status: "Shipped" };
  });
}
