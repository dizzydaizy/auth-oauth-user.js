# auth-oauth-client.js

> Octokit authentication strategy for OAuth clients

[![@latest](https://img.shields.io/npm/v/@octokit/auth-oauth-client.svg)](https://www.npmjs.com/package/@octokit/auth-oauth-client)
[![Build Status](https://github.com/octokit/auth-oauth-client.js/workflows/Test/badge.svg)](https://github.com/octokit/auth-oauth-client.js/actions?query=workflow%3ATest+branch%3Amain)

## Standalone usage

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@octokit/auth-oauth-client` directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { createOAuthClientAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-client";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @octokit/auth-oauth-client`

```js
const { createOAuthClientAuth } = require("@octokit/auth-oauth-client");
```

</td></tr>
</tbody>
</table>

### Minimal usage example

```js
const auth = createOAuthClientAuth({
  async create() {
    // implement the code exchange based on your environment.
    // You will usually get the code for the token exchange from the OAuth web flow, see
    // https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow
    return {
      token: "", // the token
      type: "oauth", // "oauth" for OAuth Apps, "app" for GitHub Apps
      scopes: ["repo_public"], // set only for OAuth Apps
    };
  },
});

const { token } = await auth({ type: "create" });

// token is the OAuth access token for the granting user
```

### Full browser usage example

This usage example assumes that the code runs on the same domain where OAuth routes exist to as defined at https://github.com/octokit/oauth-app.js#middlewares

```js
const auth = createOAuthClientAuth({
  /**
   * Get authentication object from local cache
   */
  async get(authentication) {
    if (authentication.token) {
      return {
        ...authentication,
        isSignedIn: true,
      };
    }
    return { isSignedIn: false };
  },

  /**
   * Create new authentication
   *
   * If the `?code` query parameter from the OAuth web flow is present, remove it,
   * exchange it for an OAuth access token and return the new authentication object,
   * it will be cached in localStorage (see authenticationStore)
   *
   * If the `?code` query parameter is not present, the user is redirected to the
   * OAuth webflow.
   */
  async create(authentication) {
    const code = new URL(location.href).searchParams.get("code");
    if (!code) {
      // invalidate current authentication
      await this.delete(

      // redirect to OAuth web flow
      location.href = "/api/github/oauth/login";
      return;
    }

    // remove ?code=... from URL
    const path =
      location.pathname +
      location.search.replace(/\b(code|state)=\w+/g, "").replace(/[?&]+$/, "");
    history.pushState({}, "", path);

    // exchange code for OAuth token
    const response = await fetch(baseUrl + "/token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    // return with new authentication object
    return response.json();
  },

  /**
   * Check if the locally cached authentication object is valid or not.
   */
  async check({ token }) {
    return fetch(baseUrl + "/token", {
      headers: {
        authorization: "token " + token,
      },
    }).then(
      () => true,
      (error) => {
        if (error.status === 404) return false;
        throw error;
      }
    );
  },

  /**
   * Exchange the locally cached authentication object for a new one
   */
  async reset({ token }) {
    const response = await fetch(baseUrl + "/token", {
      method: "fetch",
      headers: {
        authorization: "token " + token,
      },
    });
    return response.json();
  },

  /**
   * Refresh an expiring authentication object for a new one
   */
  async refresh({ token, refreshToken }) {
    const response = await fetch(baseUrl + "/token", {
      method: "fetch",
      headers: {
        authorization: "token " + token,
      },
      body: JSON.stringify({ refreshToken }),
    });
    return response.json();
  },

  /**
   * Invalidate the current authentcation and remove it from the local cache
   */
  async delete({ token }, { offline }) {
    if (offline) return;

    try {
      await fetch(baseUrl + "/token", {
      method: "delete",
      headers: {
        authorization: "token " + token,
      },
    })
    } catch(error) {
      if (error.status === 404) return // token was already invalid
      throw error
    }
  },

  /**
   * Revoke access from the OAuth app and remove the current authentication
   * from the local cache
   */
  async revokeGrant({ token }) {
    await fetch(baseUrl + "/grant", {
      method: "delete",
      headers: {
        authorization: "token " + token,
      },
    });
  },

  /**
   * persist authentication in local store
   * set to false to disable persistance
   */
  authenticationStore: {
    async get() {
      return JSON.parse(localStorage.getItem("authentication"));
    },
    async set(authentication) {
      localStorage.setItem("authentication", JSON.stringify(authentication));
    },
    async remove() {
      localStorage.removeItem("authentication");
    },
  },

  /**
   * persist code verification state in local store
   * set to false to disable persistance
   */
  stateStore: {
    async get() {
      return localStorage.getItem("state");
    },
    async set(state) {
      localStorage.setItem("state", state);
    },
    async remove() {
      localStorage.removeItem("state");
    },
  },
});

const {
  token,
  type,
  isSignedIn,
  createdAt,
  scopes,
  refreshToken,
  expiresAt,
} = await auth({ type: "getSession" });

const { token } = await auth({ type: "create" });
```

## Usage with Octokit

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@octokit/auth-oauth-client` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
  import { createOAuthClientAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-client";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @octokit/auth-oauth-client`. Optionally replace `@octokit/core` with a compatible module

```js
const { Octokit } = require("@octokit/core");
const { createOAuthClientAuth } = require("@octokit/auth-oauth-client");
```

</td></tr>
</tbody>
</table>

```js
const octokit = new Octokit({
  authStrategy: createOAuthClientAuth,
  auth: {
    async create() {
      // implement the code exchange based on your environment.
      // You will usually get the code for the token exchange from the OAuth web flow, see
      // https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow
      return {
        token: "", // the token
        type: "oauth", // "oauth" for OAuth Apps, "app" for GitHub Apps
        scopes: ["repo_public"], // set only for OAuth Apps
      };
    },
  },
});

// OAuth code exchange for access token happens transparently on first request
const { login } = await octokit.request("GET /user");
console.log("Hello, %!", login);
```

## `createOAuthClientAuth(options)`

The `createOAuthClientAuth` method accepts a single `options` object as argument

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.myOption</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Description here
      </td>
    </tr>
  </tbody>
</table>

## `auth(options)`

The async `auth()` method returned by `createOAuthClientAuth(options)` accepts the following options

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.myOption</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required.</strong> Description here
      </td>
    </tr>
  </tbody>
</table>

## Authentication object

The async `auth(options)` method resolves to an object with the following properties

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>type</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"myType"</code>
      </td>
    </tr>
  </tbody>
</table>

## `auth.hook(request, route, parameters)` or `auth.hook(request, options)`

`auth.hook()` hooks directly into the request life cycle. It amends the request to authenticate correctly based on the request URL.

The `request` option is an instance of [`@octokit/request`](https://github.com/octokit/request.js#readme). The `route`/`options` parameters are the same as for the [`request()` method](https://github.com/octokit/request.js#request).

`auth.hook()` can be called directly to send an authenticated request

```js
const { data: user } = await auth.hook(request, "GET /user");
```

Or it can be passed as option to [`request()`](https://github.com/octokit/request.js#request).

```js
const requestWithAuth = request.defaults({
  request: {
    hook: auth.hook,
  },
});

const { data: user } = await requestWithAuth("GET /user");
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
