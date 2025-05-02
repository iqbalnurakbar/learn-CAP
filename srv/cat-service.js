module.exports = (srv) => {
  const { Books } = cds.entities("bookstore.inventory.system");

  // Reduce stock of ordered books if available stock suffices
  srv.on("submitOrder", async (req) => {
    const { book, quantity } = req.data;
    const n = await UPDATE(Books, book)
      .with({ stock: { "-=": quantity } })
      .where({ stock: { ">=": quantity } });
    n > 0 || req.error(409, `${quantity} exceeds stock for book #${book}`);
  });

  srv.on("restockBook", async (req) => {
    const { book, quantity } = req.data;
    const n = await UPDATE(Books, book)
      .with({ stock: { "+=": quantity } })
      .where({ stock: { ">=": quantity } });
    n < 0 || req.error(400, `${quantity} exceeds stock for book #${book}`);
  });
};
