/**
 * ! This service handles custom logic to increase or decrease stock of books
 * ! via custom events: "increasedStock" and "decreasedStock".
 */
import OrderHandler from "./order-handler.js";
import StockHandler from "./stock-handler.js";
import SummaryHandler from "./summary-handler.js";

export default (srv) => {
  StockHandler(srv);

  OrderHandler(srv);

  SummaryHandler(srv);
};
