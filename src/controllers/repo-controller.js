import express from 'express';
import Token from 'models/token';
import Repo from 'models/repo';
import User from 'models/user';
import Commit from 'models/commit';
import githubApi from 'api/github-api';

function searchForRepo(req, res) {
  try {
    const { body: { id, repoName: query } } = req;
    User.findOne({ id })
      .then(user => Promise.all([user, Token.findOne({ id })]))
      .then(([user, token]) =>
        githubApi.searchRepo(token.token, query, user.login))
      .then((results) => {
        res.json({
          total_count: results.total_count,
          items: results.items.map(repo => ({
            repoName: repo.name,
            id: repo.id,
          })),
        });
      })
      .catch((error) => {
        res.json({ error: error.message });
      });
  } catch (err) {
    res.json({ error: 'Something went wrong!' });
  }
}

function syncRepoInDb(repo) {
  const repoForDb = {
    ...repo,
    ownerId: repo.owner.id,
    ownerName: repo.owner.login,
    id: Number(repo.id),
  };
  return Repo.findOneAndUpdate({ id: Number(repoForDb.id) }, repoForDb, {
    new: true,
  }).then(repoInDb => repoInDb || new Repo(repoForDb).save());
}

function addRepoToUserList(repoInDb, user) {
  return user.then((userInDb) => {
    // eslint-disable-next-line no-underscore-dangle
    if (userInDb.monitored_repos.indexOf(repoInDb._id) === -1) {
      userInDb.monitored_repos.push(repoInDb);
      return userInDb.save();
    }
    return userInDb;
  });
}

function addRepo(req, res) {
  try {
    const { body: { userId, repoId } } = req;
    const user = User.findOne({ id: userId });

    const tokenInDb = Token.findOne({ id: userId });
    // fetch repo from github and save/update to mongo
    const repoInDb = tokenInDb
      .then(token => githubApi.getRepo(token.token, repoId))
      .then(syncRepoInDb);

    // add repo to the array of monitored repos of an user
    repoInDb.then(repo => addRepoToUserList(repo, user));

    // create github webhook
    Promise.all([repoInDb, tokenInDb])
      .then(([repo, token]) =>
        githubApi.createHook(token.token, repo.ownerName, repo.name))
      .then((result) => {
        // eslint-disable-next-line no-console
        console.log(result);
      });

    // fetch commits from github and save to mongo or just get them from mongo
    const commitsInDb = Promise.all([tokenInDb, repoInDb]).then(([token, repo]) =>
      // eslint-disable-next-line no-underscore-dangle
      Commit.find({ repoId: repo._id }).then((commits) => {
        if (commits.length === 0) {
          return githubApi.getCommits(
            token.token,
            repo.ownerName,
            repo.name,
          ).then((commitsGh) => {
            const commitsToSave = commitsGh.map(commitItem => ({
              ...commitItem,
              // eslint-disable-next-line no-underscore-dangle
              repoId: repo._id,
            }));
            return Commit.insertMany(commitsToSave);
          });
        }
        return commits;
      }));

    Promise.all([repoInDb, commitsInDb]).then(([repo, commits]) => {
      const response = {
        ...repo.toJSON(),
        commits: commits.map(commit => commit.toJSON()),
      };
      res.json(response);
    });
  } catch (err) {
    res.json({ error: 'Something went wrong!' });
  }
}

function getRepoById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { withCommits, userId } = req.query;

    if (!userId) {
      res.json({ error: 'The field userId is mandatory' });
    }

    Token.findOne({ id: userId })
      .then(token => githubApi.getRepo(token.token, id))
      .then(repo =>
        Repo.findOneAndUpdate({ id: repo.id, ownerId: userId }, repo, {
          new: true,
        }))
      .then((repo) => {
        if (!repo) {
          return Promise.reject(new Error('Repository not monitored'));
        }
        return repo;
      })
      .then((repo) => {
        if (withCommits) {
          // eslint-disable-next-line no-underscore-dangle
          Commit.find({ repoId: repo._id }).then((commits) => {
            res.json({
              ...repo.toJSON(),
              commits: commits.map(commit => commit.toJSON()),
            });
          });
        } else {
          res.json(repo.toJSON());
        }
      })
      .catch((error) => {
        res.json({ error: error.message });
      });
  } catch (err) {
    res.json({ error: 'Internal error!' });
  }
}

function deleteRepoById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { userId } = req.query;

    Repo.findOne({ id, ownerId: userId })
      .then(repo => Promise.all([repo, User.findOne({ id: userId })]))
      .then(([repo, user]) => {
        if (!user) {
          return Promise.reject(new Error('User not found'));
        }

        if (!repo) {
          return Promise.reject(new Error('Repository not monitored'));
        }

        Token.findOne({ id: userId })
          .then(token => githubApi.deleteOurHooks(token.token, repo.ownerName, repo.name));

        // eslint-disable-next-line no-underscore-dangle
        Commit.remove({ repoId: repo._id }).exec();

        /* eslint-disable */
        user.monitored_repos = user.monitored_repos.filter(repoItem =>
          repo._id.equals(repoItem._id),
        );
        /* eslint-enable */
        user.save();
        repo.remove();
        res.json({ message: 'Repository deleted' });
        return Promise.resolve('success');
      })
      .catch((error) => {
        res.json({ error: error.message });
      });
  } catch (e) {
    res.json({ error: 'Internal error!' });
  }
}

function webHookReceiver(req, res) {
  res.json(req);
}

const repoRouter = express.Router({
  mergeParams: true,
});

repoRouter.post('/search', searchForRepo);
repoRouter.post('/addRepo', addRepo);
repoRouter.get('/:id', getRepoById);
repoRouter.delete('/:id', deleteRepoById);
repoRouter.post('/webhook', webHookReceiver);

export default repoRouter;
