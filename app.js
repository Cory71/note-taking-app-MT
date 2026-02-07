// Express app setup and core middleware
import express from 'express';

import indexRoutes from './routes/indexRoutes.js';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

app.use('/', indexRoutes);

export default app;


