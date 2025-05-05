/**
 * ! This service handles custom logic to increase or decrease stock of books
 * ! via custom events: "increasedStock" and "decreasedStock".
 */
import StockHandler from "./stock-handler.js";
import OrderHandler from "./order-handler.js";

export default (srv) => {
  StockHandler(srv);

  // TODO: Add submitOrder, processOrder, and shipOrder Handler
  OrderHandler(srv);
};
