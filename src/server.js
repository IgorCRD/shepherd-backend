import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import serverConfig from 'config/server-config';
import configRouter from 'config/routes-config';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const rootRouter = express.Router({ mergeParams: true });
configRouter(rootRouter); // Register all routes in the root router

app.use('/api', rootRouter);

app.listen(serverConfig.port, () => {
  // eslint-disable-next-line no-console
  console.log('Server listening on port %s, Ctrl+C to stop', serverConfig.port);
});
