import { Router } from 'express';
import { createLeadController, listLeadsController } from '../controllers/leads.controller.js';

const router = Router();

router.post('/', createLeadController);
router.get('/', listLeadsController);

export default router;
