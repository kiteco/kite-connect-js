# Kite JS Connect

[![Build Status](https://travis-ci.org/kiteco/kite-connect-js.svg?branch=master)](https://travis-ci.org/kiteco/kite-connect-js) [![codecov](https://codecov.io/gh/kiteco/kite-connect-js/branch/master/graph/badge.svg)](https://codecov.io/gh/kiteco/kite-connect-js)

## API

### KiteConnector

This is the main object exposed by the module, you can get a reference by requiring the module:

```js
const KiteConnector = require('kite-connect');
```

No other configuration is required, the object will automatically select the proper adapter for the current OS. If the module is running on a non-supported environment, a specific adapter will be used whose methods only returns rejected promises.

#### .checkHealth()

This function returns a promise that resolves with an integer corresponding to the state of Kite on the user system (see [KiteConnector.STATES](#states) for details of all possible values).

The promise can end up rejected when encountering an unknown state.

The health checks the following points:
1. Is Kite supported on that platform?
2. Is Kite installed?
3. Is Kite running?
4. Is Kite reachable?
5. Is the user authenticated?

*Note: This function replace the now deprecated `handleState` function. While this function is still available for compatibility purpose, you should use the `checkHealth` one as it makes it clearer that you're going to do the whole health check process.*

```js
KiteConnector.checkHealth().then(state => {
  // do something with state
})
```

#### .request(options, data, timeout)

Use this function to contact Kite's APIs, it uses the node `http` module and returns a promise that can either resolve with an `IncomingMessage` object or be rejected with an error.

No other processing is done on the response object, so it's up to you whether to read the data from the response or not.

When an error occurs, a health check is automatically performed and the error object will then contains information about the state of Kite. All the checks performed by the `checkHealth` method are included as well as a check of the response status code that will dispatch a `NOT_WHITELISTED` state when a `403` is received.

```js
KiteConnector.request({path: '/languages', method: 'GET'})
.then(resp => {
  // Do something with the response object
})
.catch(err => {
  // err.type: bad_state, bad_status, etc.
  // err.data: either Kite's state or the response status code
  // err.content: In case of a bad status this will contain the response text
})
```

##### Arguments

|Parameter|Type|Description|
|---|---|---|
|`options`|`Object`|The request options, as defined by [`http.request`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_http_request_options_callback)|
|`data`|`string`|*optional -* The data to send to the server in the request. These data will be send using the [`request.write`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_request_write_chunk_encoding_callback) method of the `ClientRequest` object|
|`timeout`|`number`|*optional -* The number of milliseconds of timeout as defined by [`request.setTimeout`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_request_settimeout_timeout_callback)|

#### .onDidFailRequest(listener)

Allows to listen globally to request failures. Whenever a request made using the `request` method fails, the listeners registered using that function wil be notified of that failure.

The function returns a *disposable* object (an object with a `dispose` function) you can use to unregister the passed-in listener.

```js
const disposable = KiteConnector.onDidFailRequest(err => {
  // err.type: bad_state, bad_status, etc.
  // err.data: either Kite's state or the response status code
  // err.content: In case of a bad status this will contain the response text
});

// Unregisters the previously registered listener
disposable.dispose();
```

#### .toggleRequestDebug()

When using the `kite-connect` module in an electron app, you can use this function to switch all requests to `XMLHttpRequest` instead of node's `http` module. It allows you to access all requests using chromium's devtools Network panel.

#### .isKiteSupported()

Returns a promise that resolves if the current OS is supported by Kite. The test is delegated to the underlying adapter object which will handle test for the OS version and architecture when needed.

```js
KiteConnector.isKiteSupported()
.then(() => {
  // Kite is supported
})
.catch(() => {
  // Kite is not supported
})
```

#### .isKiteInstalled()

Returns a promise that resolves if Kite is installed on this system. The test is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.isKiteInstalled()
.then(() => {
  // Kite is installed
})
.catch(() => {
  // Kite is not installed
})
```

#### .canInstallKite()

Returns a promise that resolves if Kite can be installed on this system.

```js
KiteConnector.isKiteInstalled()
.then(() => {
  // Kite is installed
})
.catch(() => {
  // Kite is not installed
})
```

#### .downloadKiteRelease(options)

Downloads latest Kite release and returns a promise that resolves when the download have been completed. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.downloadKiteRelease(options)
.then(() => {
  // Kite is downloaded
})
.catch(() => {
  // download failed
})
```

##### Options

|Option|Description|
|---|---|
|`install`|Whether or not install Kite at the end of the download. If `true` [`installKite`](#installkite) will be called at the end of the install process with the same options it received|
|`onDownloadProgress`|A function to be notified during the download process. The function should has this signature `progress(length, total, ratio)`|
|`onDownload`|A function to be notified when the download process has ended. Depending on the `install` this time can be different than the promise resolution|
|`onInstallStart`|A function to be notified when the install process starts. This option is only relevant if `install = true`|
|`onMount`|On systems where the downloaded archive has to be mounted prior to the install, this function will be called whenever the archive gets mounted. This option is only relevant if `install = true`|
|`onCopy`|A function to be notified when the copy of Kite application have been completed. This option is only relevant if `install = true`|
|`onUnmount`|On systems where the downloaded archive has to be mounted prior to the install, this function will be called whenever the archive gets unmounted. This option is only relevant if `install = true`|
|`onRemove`|A function to be notified when the temporary files have been cleaned up. This option is only relevant if `install = true`|

#### .downloadKite(url, options)

Downloads a given Kite release and returns a promise that resolves when the download have been completed. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.downloadKite(url, options)
.then(() => {
  // Kite is downloaded
})
.catch(() => {
  // download failed
})
```

##### Options

|Option|Description|
|---|---|
|`install`|Whether or not install Kite at the end of the download. If `true` [`installKite`](#installkite) will be called at the end of the install process with the same options it received|
|`onDownloadProgress`|A function to be notified during the download process. The function should has this signature `progress(length, total, ratio)`|
|`onDownload`|A function to be notified when the download process has ended. Depending on the `install` this time can be different than the promise resolution|
|`onInstallStart`|A function to be notified when the install process starts. This option is only relevant if `install = true`|
|`onMount`|On systems where the downloaded archive has to be mounted prior to the install, this function will be called whenever the archive gets mounted. This option is only relevant if `install = true`|
|`onCopy`|A function to be notified when the copy of Kite application have been completed. This option is only relevant if `install = true`|
|`onUnmount`|On systems where the downloaded archive has to be mounted prior to the install, this function will be called whenever the archive gets unmounted. This option is only relevant if `install = true`|
|`onRemove`|A function to be notified when the temporary files have been cleaned up. This option is only relevant if `install = true`|

#### .installKite(options)

Installs an already downloaded Kite release and returns a promise that resolves when the install has completed. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.installKite(options)
.then(() => {
  // Kite is now installed
})
.catch(() => {
  // install failed
})
```

##### Options

|Option|Description|
|---|---|
|`onInstallStart`|A function to be notified when the install process starts|
|`onMount`|On systems where the downloaded archive has to be mounted prior to the install, this function will be called whenever the archive gets mounted|
|`onCopy`|A function to be notified when the copy of Kite application have been completed|
|`onUnmount`|On systems where the downloaded archive has to be mounted prior to the install, this function will be called whenever the archive gets unmounted|
|`onRemove`|A function to be notified when the temporary files have been cleaned up|

#### .isKiteRunning()

Returns a promise that resolve if Kite is currently running. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.isKiteRunning()
.then(() => {
  // Kite is running
})
.catch(() => {
  // Kite is not running
})
```

#### .canRunKite()

Returns a promise that resolve when Kite is not running and can be started. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.canRunKite()
.then(() => {
  // can call runKite
})
.catch(() => {
  // Kite is either running or not installed
})
```

#### .runKiteWithCopilot()

Starts an already installed Kite, opens the Copilot, and returns a promise that will resolve if Kite have been successfully started. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.runKiteWithCopilot()
.then(() => {
  // Kite is running but not necessarily reachable
})
.catch(() => {
  // Kite couldn't be started
})
```

#### .runKite()

Starts an already installed Kite and returns a promise that will resolve if Kite have been successfully started. The operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.runKite()
.then(() => {
  // Kite is running but not necessarily reachable
})
.catch(() => {
  // Kite couldn't be started
})
```

#### .runKiteAndWait()

Starts an already installed Kite, waits until its server can be reached and returns a promise that will resolve if Kite have been successfully started and reached. The start operation is delegated to the underlying adapter object which will handle OS specific operations.

```js
KiteConnector.runKiteAndWait()
.then(() => {
  // Kite is running and reachable
})
.catch(() => {
  // Kite couldn't be started or can't be reached
})
```

#### .isKiteEnterpriseInstalled()

A version of [`isKiteInstalled`](#iskiteinstalled) that works with the enterprise version of Kite.

#### .isKiteEnterpriseRunning()

A version of [`isKiteRunning`](#iskiterunning) that works with the enterprise version of Kite.

#### .canRunKiteEnterprise()

A version of [`canRunKite`](#canrunkite) that works with the enterprise version of Kite.

#### .runKiteEnterprise()

A version of [`runKite`](#runkite) that works with the enterprise version of Kite.

#### .runKiteEnterpriseAndWait()

A version of [`runKiteAndWait`](#runkiteandwait) that works with the enterprise version of Kite.

##### .hasBothKiteInstalled()

Returns a promise that resolves when both [`isKiteInstalled`](#iskiteinstalled) and [`isKiteEnterpriseInstalled`](#iskiteenterpriseinstalled) resolves.

```js
KiteConnector.hasBothKiteInstalled()
.then(() => {
  // both versions are installed
})
.catch(() => {
  // either only one of them, or none, is installed
})
```

#### .isKiteReachable()

Calls a specific endpoint to test whether Kite's local server is responding. The function returns a promise that will resolve if the server responded (with any status) and will be rejected if the request failed.

```js
KiteConnector.isKiteReachable()
.then(() => {
  // any request can be made to Kite
})
.catch(() => {
  // Kite is not reachable
})
```

#### .waitForKite(attempts, interval)

A function that performs a given number of `attempts` to reach Kite. Each attempt is realized after the specified `interval` in milliseconds. As [`isKiteReachable`](#iskitereachable), the function returns a promise that will resolve when kite have successfully responded to a request, otherwise the promise will be rejected if no responses have been received after all `attempts` have been made.

```js
// Makes up to 10 attempts every 1.5s
KiteConnector.waitForKite(10, 1500)
.then(() => {
  // Kite has responded, any request can be made to Kite
})
.catch(() => {
  // Kite is not reachable
})
```

#### .isUserAuthenticated()

Returns a promise that resolves if the user is logged into Kite. The promise can be rejected for several reasons, however you'll get the failure details in the error.

```js
KiteConnector.isUserAuthenticated()
.then(() => {
  // Current user is logged into Kite
})
.catch(err => {
  if(err.type === 'bad_state' && err.data === STATES.UNLOGGED) {
    // we received a 401, user is not logged
  } else {
    // the request failed for another reason
  }
})
```

#### .STATES

|Name|Value|
|---|---|
|UNSUPPORTED|`0`|
|UNINSTALLED|`1`|
|NOT_RUNNING|`2`|
|UNREACHABLE|`3`|
|UNLOGGED|`4`|
|NOT_WHITELISTED|`5`|

The previous names are still available as well:

|Name|Value|
|---|---|
|INSTALLED|`2`|
|RUNNING|`3`|
|REACHABLE|`4`|
|AUTHENTICATED|`5`|

#### Adapter delegates

These methods are just delegates to the underlying adapter object.

##### .hasManyKiteInstallation()

Returns `true` if several versions of Kite are currently installed on the system, otherwise it returns `false` if only one version of Kite can be found. Note that this method is different of [`hasBothKiteInstalled`](#hasbothkiteinstalled) as it does not check the enterprise version but only the vanilla one.

##### .hasManyKiteEnterpriseInstallation()

Returns `true` if several versions of Kite enterprise are currently installed on the system, otherwise it returns `false` if only one version of Kite can be found. Note that this method is different of [`hasBothKiteInstalled`](#hasbothkiteinstalled) as it does not check the vanilla version but only the enterprise one.

##### .isAdmin()

Returns `true` if the current user has administrator rights on that device.

##### .arch()

Returns the architecture of the current device as a string (`'32bit'` or `'64bit'`).

##### .isOSSupported()

Returns whether the current os is supported or not. Generally, for an adapter such as windows and osx, this function returns `true`, but if no suitable adapter have been found, the `no-support` adapter will then return false.

##### .isOSVersionSupported()

Returns whether the current os version is supported or not. One os can be supported but that specific version isn't (such as OSX < 14).

### Test Helpers

This module also provides some test helpers that can be used to ease the process of testing your consumers of Kite's APIs.

#### withKite(options, block)

You can use the `withKite` helper to create a test suite for a specific state of Kite.

```js
const {withKite} = require('kite-connect/test/helpers/kite');

describe('some test suite', () => {
  withKite({reachable: true}, () => {
    // tests in reachable state
  })
});
```

##### Options

|Options|Type|Description|
|---|---|---|
|`supported`|`boolean`|Description|
|`canInstall`|`boolean`|Description|
|`installed`|`boolean`|Description|
|`running`|`boolean`|Description|
|`installedEnterprise`|`boolean`|Description|
|`runningEnterprise`|`boolean`|Description|
|`reachable`|`boolean`|Description|
|`logged`|`boolean`|Description|
|`admin`|`boolean`|Description|
|`arch`|`string`|Description|
|`releaseURL`|`string`|Description|
|`downloadPath`|`string`|Description|
|`sessionFilePath`|`string`|Description|
|`allInstallPaths`|`array`|Description|
|`allEnterpriseInstallPaths`|`array`|Description|

#### withKiteRoutes(routes, block)

You can use the `withKiteRoutes` within a `withKite` block to define
routes and responses that the test server will respond to requests.

Depending on whether you provided a `block` or not, the routes will apply to all the tests at the same level as your call or only to those created inside the provided function.

```js
const {withKite, withKiteRoutes} = require('kite-connect/test/helpers/kite');
const {fakeResponse} = require('kite-connect/test/helpers/http');

withKite({...}, () => {
  // All the tests at this level will have access to these routes.
  // As no function has been passed, only a beforeEach hook have been created
  withKiteRoutes([
    [
      o => o.path === '/languages',
      o => fakeResponse(200, someJSONFixture),
    ], [
      o => /^\/some-endpoint-with-params\?/.test(o.path),
      o => fakeResponse(200, someJSONFixture),
    ]
  ]);

  // calling '/languages' gives 200
});
```

```js
const {withKite, withKiteRoutes} = require('kite-connect/test/helpers/kite');
const {fakeResponse} = require('kite-connect/test/helpers/http');

withKite({...}, () => {
  // As a function has been passed to the helper as second argument,
  // a describe block has been created and only the tests
  // in this function will get a 200
  withKiteRoutes([[
    o => o.path === '/languages',
    o => fakeResponse(200),
  ]], () => {
    // calling '/languages' gives 200
  });

  // calling '/languages' gives 404
});
```
