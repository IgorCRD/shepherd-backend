import express from 'express';

const authenticationRouter = express.Router();

authenticationRouter.get('/', (req, res) => {
  res.json({ message: 'authentication!' });
});

export default authenticationRouter;
