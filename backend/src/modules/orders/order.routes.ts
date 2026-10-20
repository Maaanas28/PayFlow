import { Router } from 'express';
import { orderController } from './order.controller';
import { validate } from '../../middleware/validate';
import { createOrderSchema } from './order.schema';

const router = Router();

router.get('/products', (req, res) => orderController.getProducts(req, res));
router.post('/', validate(createOrderSchema), (req, res, next) => orderController.create(req, res, next));
router.get('/:id', (req, res, next) => orderController.getById(req, res, next));

export const orderRouter = router;
