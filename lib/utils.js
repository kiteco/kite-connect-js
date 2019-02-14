'use strict';

const http = require('http');
const https = require('https');
const child_process = require('child_process');
const KiteRequestError = require('./kite-request-error');
const KiteProcessError = require('./kite-process-error');

function deepMerge(a, b) {
  a = JSON.parse(JSON.stringify(a || {}));
  b = JSON.parse(JSON.stringify(b || {}));
  const c = Object.assign({}, a);

  Object.keys(b).forEach(k => {
    if (c[k] && typeof c[k] == 'object') {
      c[k] = deepMerge(c[k], b[k]);
    } else {
      c[k] = b[k];
    }
  });

  return c;
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.on('response', resp => resolve(resp));
    request.on('error', err => reject(err));
  });
}

function promisifyStream(stream) {
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', err => reject(err));
  });
}

function request(url) {
  return url.indexOf('https://') === 0
    ? https.request(url)
    : http.request(url);
}

function hasHeader(header, headers) {
  return header in headers ? header : false;
}

function isRedirection(resp) {
  return resp.statusCode >= 300 &&
         resp.statusCode < 400 &&
         hasHeader('location', resp.headers);
}

// Given a request this function will follow the redirection until a
// code different that 303 is returned
function followRedirections(req) {
  return promisifyRequest(req)
  .then(resp => {
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return resp;
    } else if (isRedirection(resp)) {
      const location = resp.headers.location;
      const req = request(location);
      req.end();
      return followRedirections(req);
    } else {
      throw new KiteRequestError('Invalid response status when following redirection', {
        request: req,
        response: resp,
        responseStatus: resp.statusCode,
      });
    }
  });
}

function parseSetCookies(cookies) {
  if (!Array.isArray(cookies) || !cookies.length) {
    return [];
  }
  var parse = (cookie) => {
    var parsed = {
      Path: '',
      Domain: '',
      Expires: new Date('0001-01-01T00:00:00Z'),
      RawExpires: '',
      MaxAge: 0,
      Secure: false,
      HttpOnly: false,
      Raw: '',
      Unparsed: null,
    };
    cookie.split('; ').forEach((raw) => {
      if (raw === 'HttpOnly') {
        parsed.HttpOnly = true;
        return;
      }
      if (raw === 'Secure') {
        parsed.Secure = true;
        return;
      }
      var idx = raw.indexOf('=');
      var key = raw.substring(0, idx);
      var val = raw.substring(idx + 1);
      if (key === 'Expires') {
        val = new Date(val);
      }
      if (key in parsed) {
        parsed[key] = val;
      } else {
        parsed.Name = key;
        parsed.Value = val;
      }
    });
    return parsed;
  };
  return cookies.map(parse);
}

function findCookie(cookies, name) {
  return cookies.filter(c => c.Name === name)[0];
}

function dumpCookies(cookies) {
  return cookies.map((c) => c.Name + '=' + c.Value).join('; ');
}

function handleResponseData(resp, callback) {
  if (callback) {
    let data = '';
    resp.on('data', (chunk) => data += chunk);
    resp.on('end', () => callback(data));
    return null;
  } else {
    return new Promise((resolve, reject) => {
      let data = '';
      resp.on('data', (chunk) => data += chunk);
      resp.on('error', err => reject(err));
      resp.on('end', () => resolve(data));
    });
  }
}

// Returns a new Promise that resolve if the passed-in promise is rejected and
// will be rejected with the provided error if the passed-in promise resolve.
function reversePromise(promise, rejectionMessage, resolutionMessage) {
  return new Promise((resolve, reject) => {
    promise
    .then(() => reject(rejectionMessage))
    .catch(() => resolve(resolutionMessage));
  });
}

// Given a function returning a promise, it returns a new Promise that will be
// resolved if one of the promises returned by the function resolves. If no
// promises have been resolved after the specified amount of attempts the
// returned promise will be rejected
function retryPromise(doAttempt, attempts, interval) {
  return new Promise((resolve, reject) => {
    makeAttempt(0, resolve, reject);
  });

  function makeAttempt(n, resolve, reject) {
    var retryOrReject = (err) => {
      n + 1 >= attempts
        ? reject(err)
        : makeAttempt(n + 1, resolve, reject);
    };
    setTimeout(() =>
      doAttempt().then(resolve, retryOrReject),
      n ? interval : 0);
  }
}

// Spawns a child process and returns a promise that will be resolved if
// the process ends with a code of 0, otherwise the promise will be rejected
// with an error object of the provided rejectionType.
function spawnPromise(cmd, cmdArgs, cmdOptions, rejectionType, rejectionMessage) {
  const args = [cmd];

  if (cmdArgs) {
    if (typeof cmdArgs === 'string') {
      rejectionType = cmdArgs;
      rejectionMessage = cmdOptions;
    } else {
      args.push(cmdArgs);
    }
  }

  if (cmdOptions) {
    if (typeof cmdOptions === 'string') {
      rejectionMessage = rejectionType;
      rejectionType = cmdOptions;
    } else {
      args.push(cmdOptions);
    }
  }

  return new Promise((resolve, reject) => {
    const proc = child_process.spawn(...args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => stdout +=  data);
    proc.stderr.on('data', data => stdout +=  data);

    const error = new Error();

    proc.on('close', code => {
      code
        ? reject(new KiteProcessError(rejectionType,
          {
            message: rejectionMessage,
            stderr,
            stdout,
            callStack: error.stack,
            cmd: `${cmd} ${(typeof cmdOptions != 'string' ? cmdArgs || [] : []).join(' ')}`,
            options: typeof cmdOptions != 'string' ? cmdOptions : undefined,
          }))
        : resolve(stdout);
    });
  });
}

function anyPromise(arrayOfPromises) {
  // For each promise that resolves or rejects,
  // make them all resolve.
  // Record which ones did resolve or reject
  const resolvingPromises = arrayOfPromises.map(promise => {
    return promise
    .then(result => ({resolve: true, result: result}))
    .catch(error => ({resolve: false, result: error}));
  });

  return Promise.all(resolvingPromises).then(results => {
    const resolved = results.reduce((m, r) => {
      if (m) { return m; }
      if (r.resolve) { return r; }
      return null;
    }, null);


    if (resolved) {
      return resolved.result;
    } else {
      throw results.map(r => r.result);
    }
  });
}

// Exec a child process and returns a promise that will be resolved if
// the process ends with success, otherwise the promise will be rejected
// with an error object of the provided rejectionType.
function execPromise(cmd, cmdOptions, rejectionType, rejectionMessage) {
  const args = [cmd];

  if (cmdOptions) {
    if (cmdOptions === 'string') {
      rejectionMessage = rejectionType;
      rejectionType = cmdOptions;
      cmdOptions = {};
    }
  } else {
    cmdOptions = {};
  }

  args.push(cmdOptions);

  const error = new Error();

  return new Promise((resolve, reject) => {
    child_process.exec(...args, (err, stdout, stderr) => {
      if (err) {
        reject(new KiteProcessError(rejectionType,
          {
            message: rejectionMessage,
            stdout,
            stderr,
            callStack: error.stack,
            cmd,
            options: typeof cmdOptions != 'string' ? cmdOptions : undefined,
          }));
      }
      resolve(stdout);
    });
  });
}

// Calls the passed-in function if its actually a function.
function guardCall(fn) { typeof fn === 'function' && fn(); }

// Attempts to parse a json string and returns the fallback if it can't.
function parseJSON(json, fallback) {
  try { return JSON.parse(json) || fallback; } catch (e) { return fallback; }
}

// evaluates whether a particular path should have extra processing
// done on it in the case of a Promise rejection
// NB: this should be taken out with a more robust refactor
function shouldAddCatchProcessing(path) {
  console.log('SHOULD CATCH PATH', path)
  return !path.includes('/clientapi/editor');
}

module.exports = {
  anyPromise,
  deepMerge,
  dumpCookies,
  execPromise,
  findCookie,
  followRedirections,
  guardCall,
  handleResponseData,
  parseJSON,
  parseSetCookies,
  promisifyRequest,
  promisifyStream,
  retryPromise,
  reversePromise,
  shouldAddCatchProcessing,
  spawnPromise,
};
