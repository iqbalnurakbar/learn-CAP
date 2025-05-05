using {bookstore.inventory.system as my} from '../db/schema';

service CatalogService @(path: '/browse') {

  @readonly
  entity Books        as
    projection on my.Books {
      *,
      author.name as authorName
    }

  @cds.redirection.target
  entity Orders       as projection on my.Orders;

  entity Customers    as projection on my.Customers;
  entity OrderSummary as projection on my.OrderSummary;


  // @requires: 'authenticated-user'
  action decreasedStock(book : Books : ID, quantity : Integer)                         returns {
    stock                            : Integer
  };

  action increasedStock(book : Books : ID, quantity : Integer)                         returns {
    stock                            : Integer
  };

  // TODO: Add submitOrder, processOrder, and shipOrder Handler
  action submitOrder(customer : Customers : ID, book : Books : ID, quantity : Integer) returns {
    orderID                               : UUID;
    status                                : String;
    stock                                 : Integer
  };

  action processOrder(order : Orders : ID)                                             returns Orders;
  action shipOrder(order : Orders : ID)                                                returns Orders;

  action cancelOrder(order : Orders : ID)                                              returns {
    orderID                         : UUID;
    status                          : String;
    message                         : String;
  }
}
