import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

router.get('/', (req, res) => healthController.check(req, res));

export const healthRouter = router;
