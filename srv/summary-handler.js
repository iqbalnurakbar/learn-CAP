/**
 * Implementation for Order Summary Action
 * Similar to an ABAP Function Module
 */
export default function SummaryHandler(srv) {
  const { Orders, Customers } = srv.entities;
  
  // Register handler for getOrderSummary action
  srv.on('getOrderSummary', async (req) => {
    const { customer: customerId } = req.data;
    
    if (!customerId) {
      return req.error(400, 'Customer ID is required');
    }
    
    try {
      // Get customer details - similar to ABAP SELECT SINGLE
      const customer = await SELECT.one.from(Customers)
        .where({ ID: customerId });
      
      if (!customer) {
        return req.error(404, `Customer with ID ${customerId} not found`);
      }
      
      // Get all orders for the customer - similar to ABAP SELECT with JOIN
      const orders = await SELECT.from(Orders)
        .where({ customer_ID: customerId })
        .orderBy('createdAt desc');
      
      // Create the result array with customer and related orders
      // Each order will be a separate entry in the array, with customer details repeated
      const result = orders.map(order => {
        return {
          // Include all customer fields
          ID: customer.ID,
          name: customer.name,
          email: customer.email,
          address: customer.address,
          
          // Include all order fields
          Orders: {
            ID: order.ID,
            createdAt: order.createdAt,
            status: order.status,
            customer_ID: order.customer_ID
          }
        };
      });
      
      // If there are no orders, still return customer info
      if (result.length === 0) {
        result.push({
          ID: customer.ID,
          name: customer.name,
          email: customer.email,
          address: customer.address,
          Orders: null
        });
      }
      
      return result;
    } catch (error) {
      // Error handling - similar to ABAP exceptions
      console.error('Error retrieving order summary:', error);
      return req.error(500, 'Failed to retrieve order summary');
    }
  });
};