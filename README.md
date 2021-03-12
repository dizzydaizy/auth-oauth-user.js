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
  - [Using code from [web flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow)](#using-code-from-web-flowhttpsdocsgithubcomendevelopersappsauthorizing-oauth-apps%23web-application-flow)
  - [Using code from [device flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow)](#using-code-from-device-flowhttpsdocsgithubcomendevelopersappsauthorizing-oauth-apps%23device-flow)
  - [Use an existing authentication](#use-an-existing-authentication)
- [Usage with Octokit](#usage-with-octokit)
- [`createOAuthClientAuth(options)` or `new Octokit({ auth })`](#createoauthclientauthoptions-or-new-octokit-auth-)
- [`auth(options)` or `octokit.auth(options)`](#authoptions-or-octokitauthoptions)
- [Authentication object](#authentication-object)
  - [OAuth APP authentication token](#oauth-app-authentication-token)
  - [GitHub APP user authentication token with expiring disabled](#github-app-user-authentication-token-with-expiring-disabled)
  - [GitHub APP user authentication token with expiring enabled](#github-app-user-authentication-token-with-expiring-enabled)
- [`auth.hook(request, route, parameters)` or `auth.hook(request, options)`](#authhookrequest-route-parameters-or-authhookrequest-options)
- [Contributing](#contributing)
- [License](#license)

<!-- tocstop -->

</details>

## Features

- Exchanges the code from [GitHub's OAuth web flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow) for a token
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

### Using code from [web flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow)

```js
const auth = createOAuthClientAuth({
  client_id: "123",
  client_secret: "secret",
  code: "123",
  // optional
  state: "state123",
  redirectUrl: "https://acme-inc.com/login",
});

// Exchanges the code for the user access token authentication on first call
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
    client_id: "123",
    client_secret: "secret",
    code: "123",
  },
});

// Exchanges the code for the user access token authentication on first request
// and caches the authentication for successive requests
const { login } = await octokit.request("GET /user");
console.log("Hello, %!", login);
```

## `createOAuthClientAuth(options)` or `new Octokit({ auth })`

The `createOAuthClientAuth` method accepts a single `options` object as argument. The same set of options can be passed as `auth` to the `Octokit` constructor when setting `authStrategy: createOAuthClientAuth`

When using [GitHub's OAuth web flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow)

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
        <code>clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Client ID of your GitHub/OAuth App. Find it on your app's settings page.
      </td>
    </tr>
    <tr>
      <th>
        <code>clientSecret</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Client Secret for your GitHub/OAuth App. Create one on your app's settings page.
      </td>
    </tr>
    <tr>
      <th>
        <code>code</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. The authorization code which was passed as query parameter to the callback URL from [GitHub's OAuth web application flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#web-application-flow). 
      </td>
    </tr>
    <tr>
      <th>
        <code>state</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The unguessable random string you provided in [Step 1 of GitHub's OAuth web application flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#1-request-a-users-github-identity). 
      </td>
    </tr>
    <tr>
      <th>
        <code>redirectUrl</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The <code>redirect_uri</code> parameter you provided in [Step 1 of GitHub's OAuth web application flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#1-request-a-users-github-identity).
      </td>
    </tr>
  </tbody>
</table>

When using [GitHub's OAuth device flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow)

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
        <code>clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Client ID of your GitHub/OAuth App. Find it on your app's settings page.
      </td>
    </tr>
    <tr>
      <th>
        <code>code</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>

**Required**. The `user_code` retrieved in step 1 of GitHub's OAuth device application flow](https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-1-app-requests-the-device-and-user-verification-codes-from-github).

</td>
    </tr>
    <tr>
      <th>
        <code>onVerification</code>
      </th>
      <th>
        <code>function</code>
      </th>
      <td>

**Required**. A function that is called once the device and user codes were retrieved

The `onVerification()` callback can be used to pause until the user completes step 2, which might result in a better user experience.

```js
const auth = createOAuthDeviceAuth({
  clientId: "123",
  onVerification(verification) {
    console.log("Open %s", verification.verification_uri);
    console.log("Enter code: %s", verification.user_code);

    await prompt("press enter when you are ready to continue")
  },
});
```

</td>
    </tr>
  </tbody>
</table>

When passing an existing [authentication object](#authentication-object)

## `auth(options)` or `octokit.auth(options)`

The async `auth()` method returned by `createOAuthClientAuth(options)` or set on the `octokit` instance when the `Octokit` constructor was called with `authStrategy: createOAuthClientAuth`.

Resolves with an [authentication object](#authentication-object).

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
        <code>option</code>
      </th>
      <th>
        <code>type</code>
      </th>
      <td>

Without setting `type` auth will return the current authentication object, or exchange the `code` from the strategy options on first call. Possible values for `type` are

- `"check"`: sends request to verify the validity of the current token
- `"reset"`: invalidates current token and replaces it with a new one
- `"refresh"`: GitHub Apps only, and only if expiring user tokens are enabled.
- `"delete"`: invalidates current token
- `"deleteAuthorization"`: revokes OAuth access for application. All tokens for the current user created by the same app are invalidated. The user will be prompted to grant access again during the next OAuth web flow.

</td>
    </tr>
    <tr>
      <th>
        <code>option</code>
      </th>
      <th>
        <code>type</code>
      </th>
      <td>
      </td>
    </tr>
  </tbody>
</table>

## Authentication object

There are three possible results

1. [OAuth APP authentication token](#oauth-app-authentication-token)
1. [GitHub APP user authentication token with expiring disabled](#github-app-user-authentication-token-with-expiring-disabled)
1. [GitHub APP user authentication token with expiring enabled](#github-app-user-authentication-token-with-expiring-enabled)

### OAuth APP authentication token

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
        <code>"token"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The user access token
      </td>
    </tr>
    <tr>
      <th>
        <code>tokenType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"oauth"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The app's <code>Client ID</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"oauth-app"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>scopes</code>
      </th>
      <th>
        <code>array of strings</code>
      </th>
      <td>
        array of scope names enabled for the token
      </td>
    </tr>
    <tr>
      <th>
        <code>invalid</code>
      </th>
      <th>
        <code>boolean</code>
      </th>
      <td>

Either `undefined` or `true`. Will be set to `true` if the token was invalided explicitly or found to be invalid

</td>
    </tr>
  </tbody>
</table>

### GitHub APP user authentication token with expiring disabled

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
        <code>"token"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The user access token
      </td>
    </tr>
    <tr>
      <th>
        <code>tokenType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"oauth"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The app's <code>Client ID</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"github-app"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>invalid</code>
      </th>
      <th>
        <code>boolean</code>
      </th>
      <td>

Either `undefined` or `true`. Will be set to `true` if the token was invalided explicitly or found to be invalid

</td>
  </tbody>
</table>

### GitHub APP user authentication token with expiring enabled

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
        <code>"token"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The user access token
      </td>
    </tr>
    <tr>
      <th>
        <code>tokenType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"oauth"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The app's <code>Client ID</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"github-app"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>refreshToken</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The refresh token
      </td>
    </tr>
    <tr>
      <th>
        <code>expiresAt</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Date timestamp in <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString">ISO 8601</a> standard. Example: <code>2022-01-01T08:00:0.000Z</code>
      </td>
    </tr>
    </tr>
    <tr>
      <th>
        <code>refreshTokenExpiresAt</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Date timestamp in <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString">ISO 8601</a> standard. Example: <code>2021-07-01T00:00:0.000Z</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>invalid</code>
      </th>
      <th>
        <code>boolean</code>
      </th>
      <td>

Either `undefined` or `true`. Will be set to `true` if the token was invalided explicitly or found to be invalid

</td>
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
