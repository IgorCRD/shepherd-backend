import gitHubApiConfig from 'config/github-api-config';
import fetch from 'node-fetch';
import { URL, URLSearchParams } from 'url';

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
}

export default new GitHubApi();
