import { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { getAllProducts } from '../catalog/catalog.data';

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        data: order,
        meta: {
          isSimulation: true,
          disclaimer: 'Sandbox only — no real money is processed.',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  getProducts(_req: Request, res: Response): void {
    const products = getAllProducts();
    res.status(200).json({
      success: true,
      data: products,
    });
  }
}

export const orderController = new OrderController();
