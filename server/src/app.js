import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import routes from './routes/index.js';
import { errorConverter, errorHandler } from './middlewares/error.js';
import ApiError from './utils/ApiError.js';

const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.use('/v1', routes);

app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use(errorConverter);
app.use(errorHandler);

export default app;
