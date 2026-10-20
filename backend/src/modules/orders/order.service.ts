import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/app-error';
import { getProductById } from '../catalog/catalog.data';
import { CreateOrderInput } from './order.schema';
import { Order, OrderStatus } from '../../types';

export class OrderService {
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const product = getProductById(input.productId);
    if (!product) {
      throw AppError.badRequest(
        `Product with ID '${input.productId}' does not exist in catalog`,
        'INVALID_PRODUCT'
      );
    }

    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw AppError.badRequest(
        'Quantity must be an integer greater than or equal to 1',
        'INVALID_QUANTITY'
      );
    }

    // Calculation is strictly server-side
    const totalPriceMinor = product.unitPriceMinor * input.quantity;

    const order = await prisma.order.create({
      data: {
        productId: product.id,
        productName: product.name,
        quantity: input.quantity,
        unitPriceMinor: product.unitPriceMinor,
        totalPriceMinor,
        currency: product.currency,
        status: OrderStatus.CREATED,
      },
    });

    return order;
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw AppError.notFound(`Order with ID '${orderId}' not found`, 'ORDER_NOT_FOUND');
    }

    return order;
  }
}

export const orderService = new OrderService();
