using {
  cuid,
  Country,
} from '@sap/cds/common';

namespace bookstore.inventory.system;


entity Authors : cuid {
  name      : String;
  biography : String;
  books     : Association to many Books
                on books.author = $self;

}

entity Publishers : cuid {
  name    : String;
  country : Country;
  books   : Association to many Books
              on books.publisher = $self;

}

entity Books : cuid {
  title           : localized String;
  publicationDate : Date;
  price           : Decimal(9, 2) @assert.range: [
    0,
    null
  ];
  stock           : Integer;
  author          : Association to Authors;
  publisher       : Association to Publishers;

}

entity Customers : cuid {
  name    : String;
  email   : String;
  address : String;
  orders  : Association to many Orders
              on orders.customer = $self;


}

entity Orders : cuid {
  customer  : Association to Customers;
  createdAt : Timestamp;
  status    : OrderStatus;
  items     : Composition of many OrderItems
                on items.parent = $self;

}

entity OrderItems : cuid {
  parent   : Association to Orders;
  book     : Association to Books;
  quantity : Integer;
  price    : Decimal(9, 2);
}


type OrderStatus : String enum {
  New;
  Processed;
  Shipped;
  Cancelled;
}
