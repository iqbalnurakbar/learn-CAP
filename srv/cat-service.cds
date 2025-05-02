using {bookstore.inventory.system as my} from '../db/schema';

service CatalogService @(path: '/browse') {

  @readonly
  entity Books as
    projection on my.Books {
      *,
      author.name as authorName
    }

  action submitOrder(book : Books : ID, quantity : Integer) returns {
    stock                         : Integer
  };

  action restockBook(book : Books : ID, quantity : Integer) returns {
    stock                         : Integer
  };
}
