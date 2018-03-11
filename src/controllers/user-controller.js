import express from 'express';
import GitHubApi from 'api/github-api';
import User from 'models/user';
import Token from 'models/token';

function fetchUser(code) {
  return GitHubApi.getTokenFromCode(code).then(tokenP =>
    GitHubApi.getUserByToken(tokenP.access_token));
}

function syncTokenInDb(user) {
  const { token, ...userWithoutToken } = user;
  return Token.findOneAndUpdate({ id: user.id }, { token }, { new: true }).then((tokenInDb) => {
    if (tokenInDb) {
      return userWithoutToken;
    }
    const newToken = new Token({ id: user.id, token });
    return newToken.save().then(tokenSaved => (tokenSaved ? userWithoutToken : null));
  });
}

function syncUserInDb(user) {
  return User.findOneAndUpdate({ id: user.id }, user, { new: true }).then(userInDb => userInDb || new User(user).save());
}

function authenticateUser(req, res) {
  const { body: { code } } = req;
  try {
    fetchUser(code)
      .then(syncTokenInDb)
      .then(syncUserInDb)
      .then((userFromDb) => {
        if (!userFromDb) {
          res.json({ error: 'Authentication failed!' });
        }
        res.json(userFromDb);
      });
  } catch (e) {
    res.json({ error: 'Authentication failed!' });
  }
}

function getUserById(req, res) {
  try {
    const id = Number(req.params.id);
    Token.find({ id })
      .then(token => GitHubApi.getUserByToken(token[0].token))
      .then(syncUserInDb)
      .then((userFromDb) => {
        if (!userFromDb) {
          res.json({ error: 'User not found!' });
        }
        res.json(userFromDb);
      });
  } catch (e) {
    res.json({ error: 'User not found!' });
  }
}

const userRouter = express.Router({
  mergeParams: true,
});

userRouter.post('/authenticate', authenticateUser);
userRouter.get('/:id', getUserById);

export default userRouter;
