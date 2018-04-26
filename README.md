# Kite JS Connect

[![Build Status](https://travis-ci.org/kiteco/kite-connect-js.svg?branch=master)](https://travis-ci.org/kiteco/kite-connect-js) [![codecov](https://codecov.io/gh/kiteco/kite-connect-js/branch/master/graph/badge.svg)](https://codecov.io/gh/kiteco/kite-connect-js)

## API

### KiteConnector

This is the main object exposed by the module, you can get a reference by requiring the module:

```js
const KiteConnector = require('kite-connect-js');
```

No other configuration is required, the object will automatically select the proper adapter for the current OS. If the module is running on a non-supported environment, a specific adapter will be used whose methods only returns rejected promises.

#### .checkHealth()

This function returns a promise that resolves with an integer corresponding to the state of Kite on the user system (see [KiteConnector.STATES](#-states) for details of all possible values).

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
|`install`|Whether or not install Kite at the end of the download. If `true` [`installKite`](#-installkite) will be called at the end of the install process with the same options it received|
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
|`install`|Whether or not install Kite at the end of the download. If `true` [`installKite`](#-installkite) will be called at the end of the install process with the same options it received|
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

Returns a promise that resovle if Kite is currently running. The operation is delegated to the underlying adapter object which will handle OS specific operations.

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

#### .runKite()
#### .runKiteAndWait()

#### .isKiteEnterpriseInstalled()
#### .isKiteEnterpriseRunning()
#### .canRunKiteEnterprise()
#### .runKiteEnterprise()
#### .runKiteEnterpriseAndWait()

#### .isKiteReachable()
#### .waitForKite()

#### .isUserAuthenticated()
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

### Test Helpers

This module also provides some test helpers that can be used to ease the process of testing your consumers of Kite's APIs.

#### withKite(options, block)

You can use the `withKite` helper to create a test suite for a specific state of Kite.

```js
const {withKite} = require('kite-connect-js/test/helpers/support');

describe('some test suite', () => {
  withKite({logged: true}, () => {
    // tests in logged state
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
const {withKite, withKiteRoutes} = require('kite-connect-js/test/helpers/support');
const {fakeResponse} = require('kite-connect-js/test/helpers/http');

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
const {withKite, withKiteRoutes} = require('kite-connect-js/test/helpers/support');
const {fakeResponse} = require('kite-connect-js/test/helpers/http');

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
