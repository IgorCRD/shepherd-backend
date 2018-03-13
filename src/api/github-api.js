import gitHubApiConfig from 'config/github-api-config';
import fetch from 'node-fetch';
import { URL, URLSearchParams } from 'url';

function dateMonthsSubtraction(date, monthsAgo) {
  const averageDaysInMonth = 30;
  const monthsAgoInt = Math.floor(monthsAgo);
  const daysAgo = (monthsAgo - monthsAgoInt) * averageDaysInMonth;

  const timeAgo = new Date(date.getTime());
  timeAgo.setDate(timeAgo.getDate() - daysAgo);
  timeAgo.setMonth(timeAgo.getMonth() - monthsAgo);

  return timeAgo;
}

class GitHubApi {
  static headers = {
    Accept: 'application/json',
    'User-Agent': 'Shepherd',
  };

  getAcessTokenUrl = (code) => {
    const config = { ...gitHubApiConfig.keys, code };
    const getTokenUrl = new URL(gitHubApiConfig.accessTokenUrl);
    getTokenUrl.search = new URLSearchParams(config);

    return getTokenUrl.href;
  };

  getTokenFromCode = code =>
    fetch(this.getAcessTokenUrl(code), {
      method: 'POST',
      headers: { ...GitHubApi.headers },
    }).then(resp => resp.json());

  getUserByToken = (token) => {
    const apiUrl = new URL(gitHubApiConfig.gitHubApiUrl);
    apiUrl.pathname = '/user';

    return fetch(apiUrl.href, {
      method: 'GET',
      headers: { ...GitHubApi.headers, Authorization: `token  ${token}` },
    })
      .then(resp => resp.json())
      .then(user => ({ token, ...user }));
  };

  searchRepo = (token, query, repoOwner) => {
    const searchRepoUrl = new URL(gitHubApiConfig.gitHubApiUrl);
    searchRepoUrl.pathname = '/search/repositories';
    searchRepoUrl.search = `q=${query}${repoOwner ? `+user:${repoOwner}` : ''}`;

    return fetch(searchRepoUrl.href, {
      method: 'GET',
      headers: { ...GitHubApi.headers, Authorization: `token  ${token}` },
    }).then(resp => resp.json());
  };

  getRepo = (token, repoId) => {
    const getRepoUrl = new URL(gitHubApiConfig.gitHubApiUrl);
    getRepoUrl.pathname = `/repositories/${repoId}`;

    return fetch(getRepoUrl.href, {
      method: 'GET',
      headers: { ...GitHubApi.headers, Authorization: `token  ${token}` },
    }).then(resp => resp.json());
  };

  getCommits = (token, userName, repoName, howOldInMonths = 1) => {
    const nMonthsAgo = dateMonthsSubtraction(new Date(), howOldInMonths);

    const getCommitsUrl = new URL(gitHubApiConfig.gitHubApiUrl);
    getCommitsUrl.pathname = `/repos/${userName}/${repoName}/commits`;
    getCommitsUrl.search = `since=${nMonthsAgo.toJSON()}`;

    return fetch(getCommitsUrl.href, {
      method: 'GET',
      headers: {
        ...GitHubApi.headers,
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.cloak-preview',
      },
    }).then(resp => resp.json());
  };

  deleteOurHooks = (token, repoOwner, repoName) => {
    const getHooksUrl = new URL(gitHubApiConfig.gitHubApiUrl);
    getHooksUrl.pathname = `/repos/${repoOwner}/${repoName}/hooks`;

    fetch(getHooksUrl.href, {
      method: 'GET',
      headers: {
        ...GitHubApi.headers,
        Authorization: `token ${token}`,
      },
    })
      .then(resp => resp.json())
      .then((hooks) => {
        const ourHooks = hooks.filter(hook => hook.config.url === gitHubApiConfig.webhookRedirectURL);
        const deleteHookUrl = new URL(gitHubApiConfig.gitHubApiUrl);
        ourHooks.forEach((hook) => {
          deleteHookUrl.pathname = `/repos/${repoOwner}/${repoName}/hooks/${
            hook.id
          }`;
          fetch(deleteHookUrl.href, {
            method: 'DELETE',
            headers: {
              ...GitHubApi.headers,
              Authorization: `token ${token}`,
            },
          });
        });
      });
  };

  createHook = (token, repoOwner, repoName) => {
    const createHookUrl = new URL(gitHubApiConfig.gitHubApiUrl);
    createHookUrl.pathname = `/repos/${repoOwner}/${repoName}/hooks`;

    return fetch(createHookUrl.href, {
      method: 'POST',
      headers: {
        ...GitHubApi.headers,
        Authorization: `token ${token}`,
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: gitHubApiConfig.webhookRedirectURL,
          content_type: 'json',
        },
      }),
    });
  };
}

export default new GitHubApi();
