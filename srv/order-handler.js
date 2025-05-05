import { v4 as uuidv4 } from "uuid";

export default function OrderHandler(srv) {
  srv.on("submitOrder", async (req) => {
    const { customer: customerID, book: bookID, quantity } = req.data;
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

    // let customerID = req.user?.ID;
    // console.log(req.user)
    let existingCustomer = customerID;

    if (!existingCustomer) {
      existingCustomer = uuidv4();
      await INSERT.into(Customers).entries({
        ID: existingCustomer,
        name: "Test-001",
        email: `test001@example.com`,
        address: "N/A",
      });
    }
    // Insert order and get the ID
    const orderID = uuidv4();
    await INSERT.into(Orders).entries({
      ID: orderID,
      customer: { ID: existingCustomer },
      status: "New",
      createdAt: new Date().toISOString(),
    });

    // Insert order item
    await INSERT.into(OrderItems).entries({
      parent_ID: orderID,
      book_ID: bookID,
      quantity,
      price: book.price,
    });

    return {
      existingCustomer,
      orderID,
      status: "New",
      quantity: quantity,
      price: book.price,
      message: `Order ${orderID} created for book ${bookID}!`
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

    return {
      id: orderID,
      status: "Processed",
      message: `Order ${orderID} processed. Stock updated!`
    };
  });

  srv.on("shipOrder", async (req) => {
    const { order: orderID } = req.data;
    const { Orders } = cds.entities("bookstore.inventory.system");
    const order = await SELECT.one.from(Orders, orderID).columns("status");
    if (!order) return req.error(404, "Order not found!");
    if (order.status !== "Processed")
      return req.error(400, "Order must be processed first!");
    await UPDATE(Orders, orderID).set({ status: "Shipped" });
    return {
      ID: orderID,
      status: "Shipped",
      message: `Order ${orderID} shipped!`
    };
  });

  srv.on("cancelOrder", async (req) => {
    const { order: orderID } = req.data;

    const { Orders, OrderItems, Books } = cds.entities(
      "bookstore.inventory.system"
    );

    const order = await SELECT.one
      .from(Orders, orderID)
      .columns("customer_ID as customerID", "status");

    if (!order) return req.error(404, "Order not found!");
    if (order.status === "Shipped")
      return req.error(400, "Cannot cancel shipped order!");
    if (order.status === "Cancelled")
      return req.error(400, "Order already cancelled!");

    if (order.status === "Processed") {
      const items = await SELECT.from(OrderItems)
        .where({ parent_ID: orderID })
        .columns("book_ID as bookID", "quantity");
      for (const item of items) {
        await UPDATE(Books, item.bookID).set({
          stock: { "+=": item.quantity },
        });
      }
    }

    await UPDATE(Orders, orderID).set({ status: "Cancelled" });
    return {
      orderID,
      status: "Cancelled",
      message: `Order ${orderID} cancelled`,
    };
  });
}
