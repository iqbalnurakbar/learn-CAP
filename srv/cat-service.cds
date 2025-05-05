using {bookstore.inventory.system as my} from '../db/schema';

service CatalogService @(path: '/browse') {

  @readonly
  entity Books as
    projection on my.Books {
      *,
      author.name as authorName
    }

  action decreasedStock(book : Books : ID, quantity : Integer) returns {
    stock                            : Integer
  };

  action increasedStock(book : Books : ID, quantity : Integer) returns {
    stock                            : Integer
  };

  action submitOrder(book : Books : ID, quantity : Integer)    returns {
    orderID                       : UUID;
    status                        : String;
    stock                         : Integer
  }
}
