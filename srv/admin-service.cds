using {bookstore.inventory.system as my} from '../db/schema';

service AdminService @(path: '/admin') {
  entity Authors      as projection on my.Authors;
  entity Books        as projection on my.Books;
  entity Customers    as projection on my.Customers;
  entity Publishers   as projection on my.Publishers;

  @cds.redirection.target
  entity Orders       as projection on my.Orders;

  entity OrderItems   as projection on my.OrderItems;
  entity OrderSummary as projection on my.OrderSummary;
}
