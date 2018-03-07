import express from 'express';
import config from 'config/server-config';
import routes from 'config/routes';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const rootRouter = express.Router({ mergeParams: true });
routes(rootRouter); // Register all routes in the root router

app.use('/api', rootRouter);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log('Server listening on port %s, Ctrl+C to stop', config.port);
});
