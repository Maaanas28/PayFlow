import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validate } from '../../middleware/validate';
import { createPaymentSchema, reconcilePaymentSchema } from './payment.schema';

const router = Router();

router.get('/', (req, res, next) => paymentController.list(req, res, next));
router.post('/', validate(createPaymentSchema), (req, res, next) => paymentController.create(req, res, next));
router.get('/:id', (req, res, next) => paymentController.getById(req, res, next));
router.post('/:id/reconcile', validate(reconcilePaymentSchema), (req, res, next) => paymentController.reconcile(req, res, next));

export const paymentRouter = router;
