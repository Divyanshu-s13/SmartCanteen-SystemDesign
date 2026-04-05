/**
 * Queue Routes
 * Routes for queue endpoints
 */

import { Router } from 'express';
import { orderController } from '../controllers';

const router = Router();

// Public route to view current queue (for display screens)
router.get('/', orderController.getCurrentQueue);

export default router;
