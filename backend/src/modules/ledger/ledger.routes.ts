import { Router } from 'express';
import { ledgerController } from './ledger.controller';

const router = Router();

router.get('/transactions', (req, res, next) => ledgerController.listTransactions(req, res, next));
router.get('/payments/:id', (req, res, next) => ledgerController.getForPayment(req, res, next));
router.get('/transactions/:referenceType/:referenceId', (req, res, next) => ledgerController.getByReference(req, res, next));

export const ledgerRouter = router;
