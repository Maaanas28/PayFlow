import { Router } from 'express';
import { refundController } from './refund.controller';
import { validate } from '../../middleware/validate';
import { createRefundSchema } from './refund.schema';

const paymentRefundRouter = Router({ mergeParams: true });
paymentRefundRouter.post('/', validate(createRefundSchema), (req, res, next) => refundController.create(req, res, next));
paymentRefundRouter.get('/', (req, res, next) => refundController.listForPayment(req, res, next));

const standaloneRefundRouter = Router();
standaloneRefundRouter.get('/', (req, res, next) => refundController.listAll(req, res, next));
standaloneRefundRouter.get('/:id', (req, res, next) => refundController.getById(req, res, next));

export { paymentRefundRouter, standaloneRefundRouter };
