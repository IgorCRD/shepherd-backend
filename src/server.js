import express from 'express';
import config from 'config/server-config';
import routes from 'controllers/routes';
import bodyParser from 'body-parser';

const app = express();
const rootRouter = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

rootRouter.get('/', (req, res) => {
  res.json({ message: 'Gits watcher api!' });
});

routes(rootRouter); // Register all routes in the root router

app.use('/api', rootRouter);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log('Server listening on port %s, Ctrl+C to stop', config.port);
});
