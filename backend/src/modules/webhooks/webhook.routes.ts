import { Router } from 'express';
import { webhookController } from './webhook.controller';

const router = Router();

router.get('/events', (req, res, next) => webhookController.listEvents(req, res, next));
router.get('/events/:id', (req, res, next) => webhookController.getEventById(req, res, next));
router.post('/events/:id/deliver', (req, res, next) => webhookController.deliverEvent(req, res, next));
router.post('/test-target', (req, res) => webhookController.testReceiver(req, res));

export const webhookRouter = router;
