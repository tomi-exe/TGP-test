import express from 'express';
import leadsRoutes from './routes/leads.routes.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/leads', leadsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
