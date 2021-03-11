# auth-oauth-user.js

> Octokit authentication strategy for OAuth user authentication

[![@latest](https://img.shields.io/npm/v/@octokit/auth-oauth-user.svg)](https://www.npmjs.com/package/@octokit/auth-oauth-user)
[![Build Status](https://github.com/octokit/auth-oauth-user.js/workflows/Test/badge.svg)](https://github.com/octokit/auth-oauth-user.js/actions?query=workflow%3ATest+branch%3Amain)

**Important:** `@octokit/auth-oauth-user` requires your app's `client_secret`, which must not be exposed. It's meant to be used on a server. If you are looking for an OAuth user authentication strategy that can be used on a client (browser, IoT, CLI), check out [`@octokit/auth-oauth-user-client`](https://github.com/octokit/auth-oauth-user-client.js#readme).

<details>
<summary>Table of contents</summary>

<!-- toc -->

- [Features](#features)
- [Standalone usage](#standalone-usage)
  - [Using code from [web flow](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow)](#using-code-from-web-flowhttpsdevelopergithubcomappsbuilding-oauth-appsauthorizing-oauth-apps%23web-application-flow)
  - [Using code from [device flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow)](#using-code-from-device-flowhttpsdocsgithubcomendevelopersappsauthorizing-oauth-apps%23device-flow)
  - [Use an existing authentication](#use-an-existing-authentication)
- [Usage with Octokit](#usage-with-octokit)
- [`createOAuthClientAuth(options)`](#createoauthclientauthoptions)
- [`auth(options)`](#authoptions)
- [Authentication object](#authentication-object)
- [`auth.hook(request, route, parameters)` or `auth.hook(request, options)`](#authhookrequest-route-parameters-or-authhookrequest-options)
- [Contributing](#contributing)
- [License](#license)

<!-- tocstop -->

</details>

## Features

- Exchanges the code from [GitHub's OAuth web flow](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow) for a token
- Supports [GitHub's OAuth device flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow)
- Supports auto-refreshing for [expiring user access tokens](https://docs.github.com/en/developers/apps/refreshing-user-to-server-access-tokens)
- Can be instantiated using a previously obtained authentication
- Can check a token, reset a token, invalidate a token, and delete an app authorization.

## Standalone usage

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@octokit/auth-oauth-user` directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { createOAuthClientAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-user";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @octokit/auth-oauth-user`

```js
const { createOAuthClientAuth } = require("@octokit/auth-oauth-user");
```

</td></tr>
</tbody>
</table>

### Using code from [web flow](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow)

```js
const auth = createOAuthClientAuth({
  client_id: "123",
  client_secret: "secret",
  code: "123",
  // optional
  state: "state123",
  redircetUrl: "https://acme-inc.com/login",
});

// Exchanges the code for the user access token on first call
// and caches the authentication for successive calls
const { token } = await auth();
```

### Using code from [device flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow)

```js
const auth = createOAuthClientAuth({
  client_id: "123",
  code: "123",
  onVerification(verification) {
    // verification example
    // {
    //   device_code: "3584d83530557fdd1f46af8289938c8ef79f9dc5",
    //   user_code: "WDJB-MJHT",
    //   verification_uri: "https://github.com/login/device",
    //   expires_in: 900,
    //   interval: 5,
    // };

    console.log("Open %s", verification.verification_uri);
    console.log("Enter code: %s", verification.user_code);
  },
});

// resolves once the user entered the `user_code` on `verification_uri`
const { token } = await auth();
```

### Use an existing authentication

```js
const auth = createOAuthClientAuth({
  client_id: "123",
  client_secret: "secret",
  token: "token123",
  // only relevant for OAuth Apps
  scopes: [],
  // only relevant for GitHub Apps
  refreshToken: "r1.refreshtoken123"
  expiresAt: "2022-01-01T08:00:0.000Z",
  refreshTokenExpiresAt: "2021-07-01T00:00:0.000Z",
});

// will return the passed authentication
const { token } = await auth();
```

## Usage with Octokit

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@octokit/auth-oauth-user` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
  import { createOAuthClientAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-user";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @octokit/auth-oauth-user`. Optionally replace `@octokit/core` with a compatible module

```js
const { Octokit } = require("@octokit/core");
const { createOAuthClientAuth } = require("@octokit/auth-oauth-user");
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
