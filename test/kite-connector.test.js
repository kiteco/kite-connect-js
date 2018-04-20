'use strict';

// const http = require('http');
// const https = require('https');
const {KiteConnector} = require('../lib');

const {waitsForPromise} = require('./helpers/async');
const {withKite} = require('./helpers/support');
// const {fakeRequestMethod, fakeResponse, withFakeServer, withRoutes} = require('./helpers/http');
// const {
//   fakeKiteInstallPaths,
//   withKiteInstalled, withKiteRunning, withKiteNotRunning,
//   withKiteReachable, withKiteNotReachable,
//   withKiteNotAuthenticated, withKiteWhitelistedPaths,
//   withKiteEnterpriseRunning,
// } = require('./helpers/system');

describe('KiteConnector', () => {

  describe('.canInstallKite()', () => {
    withKite({supported: false}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canInstallKite());
      });
    });

    withKite({installed: true}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canInstallKite());
      });
    });

    withKite({installed: false}, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => KiteConnector.canInstallKite());
      });
    });
  });

  // describe('.downloadKiteRelease()', () => {
  //   beforeEach(() => {
  //     spyOn(KiteConnector, 'downloadKite');
  //   });
  //
  //   it('calls downloadKite with the release path of the current platform', () => {
  //     KiteConnector.downloadKiteRelease();
  //     expect(KiteConnector.downloadKite)
  //     .toHaveBeenCalledWith(KiteConnector.releaseURL, {});
  //   });
  // });
  //
  // describe('.downloadKite()', () => {
  //   withFakeServer([
  //     [
  //       o => /^http:\/\/kite\.com/.test(o) ||
  //            o === 'https://s3-us-west-1.amazonaws.com/kite-downloads/windows/KiteSetup.exe',
  //       o => fakeResponse(303, '', {headers: {location: 'https://download.kite.com'}}),
  //     ], [
  //       o => /^https:\/\/download\.kite\.com/.test(o),
  //       o => fakeResponse(200, 'foo'),
  //     ],
  //   ], () => {
  //     describe('when the download succeeds', () => {
  //       describe('without the install option', () => {
  //         beforeEach(() => {
  //           spyOn(KiteConnector, 'installKite');
  //         });
  //         it('returns a resolved promise', () => {
  //           const options = { onDownload: jasmine.createSpy() };
  //           const url = 'http://kite.com/download';
  //
  //           return waitsForPromise(() => KiteConnector.downloadKite(url, options))
  //           .then(() => {
  //             expect(https.request).toHaveBeenCalledWith('http://kite.com/download');
  //             expect(options.onDownload).toHaveBeenCalled();
  //
  //             expect(KiteConnector.installKite).not.toHaveBeenCalled();
  //           });
  //         });
  //       });
  //     });
  //   });
  // });
  //
  // describe('.isKiteReachable()', () => {
  //   withKiteNotRunning(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () =>
  //         KiteConnector.isKiteReachable());
  //     });
  //   });
  //
  //   withKiteRunning(() => {
  //     describe('and is reachable', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(true));
  //       });
  //
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() => KiteConnector.isKiteReachable());
  //       });
  //     });
  //
  //     describe('and is not reachable', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(false));
  //       });
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isKiteReachable());
  //       });
  //     });
  //   });
  //
  //   withKiteEnterpriseRunning(() => {
  //     describe('and is reachable', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(true));
  //       });
  //
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() => KiteConnector.isKiteReachable());
  //       });
  //     });
  //
  //     describe('and is not reachable', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(false));
  //       });
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isKiteReachable());
  //       });
  //     });
  //   });
  // });
  //
  // describe('.waitForKite()', () => {
  //   withKiteRunning(() => {
  //     beforeEach(() => {
  //       spyOn(http, 'request').andCallFake(fakeRequestMethod(true));
  //     });
  //
  //     it('returns a resolving promise', () => {
  //       return waitsForPromise(() => KiteConnector.waitForKite(5, 0));
  //     });
  //   });
  //
  //   withKiteNotRunning(() => {
  //     beforeEach(() => {
  //       spyOn(KiteConnector, 'isKiteReachable').andCallThrough();
  //     });
  //
  //     it('returns a promise that will be rejected after the specified number of attempts', () => {
  //       return waitsForPromise({shouldReject: true}, () => KiteConnector.waitForKite(5, 0))
  //       .then(() => {
  //         expect(KiteConnector.isKiteReachable.callCount).toEqual(5);
  //       });
  //     });
  //   });
  // });
  //
  // describe('.isUserAuthenticated()', () => {
  //   withKiteRunning(() => {
  //     describe('when the user is not authenticated', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(fakeResponse(401)));
  //       });
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isUserAuthenticated());
  //       });
  //     });
  //
  //     describe('when the request ends with another status code', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(fakeResponse(500)));
  //       });
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isUserAuthenticated());
  //       });
  //     });
  //
  //     xdescribe('when the request ends a 200 status code but the wrong data', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request').andCallFake(fakeRequestMethod(fakeResponse(200)));
  //       });
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isUserAuthenticated());
  //       });
  //     });
  //
  //     describe('when the user is authenticated', () => {
  //       beforeEach(() => {
  //         spyOn(http, 'request')
  //         .andCallFake(fakeRequestMethod(fakeResponse(200, 'authenticated')));
  //       });
  //
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() => KiteConnector.isUserAuthenticated());
  //       });
  //     });
  //   });
  // });
  //
  // describe('.canAuthenticateUser()', () => {
  //   withKiteReachable(() => {
  //     it('returns a resolving promise', () => {
  //       return waitsForPromise(() => KiteConnector.canAuthenticateUser());
  //     });
  //   });
  //
  //   withKiteNotReachable(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () => KiteConnector.canAuthenticateUser());
  //     });
  //   });
  // });
  //
  // describe('.authenticateUser()', () => {
  //   withKiteNotReachable(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () => KiteConnector.canAuthenticateUser());
  //     });
  //   });
  //
  //   withKiteReachable(() => {
  //     describe('and the authentication succeeds', () => {
  //       withRoutes([[
  //         o => /^\/api\/account\/login/.test(o.path),
  //         o => fakeResponse(200, 'authenticated'),
  //       ]]);
  //
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() =>
  //           KiteConnector.authenticateUser('email', 'password'));
  //       });
  //     });
  //
  //     describe('and the authentication fails', () => {
  //       withRoutes([[
  //         o => /^\/api\/account\/login/.test(o.path),
  //         o => fakeResponse(401),
  //       ]]);
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.authenticateUser('email', 'password'));
  //       });
  //     });
  //   });
  // });
  //
  // describe('.authenticateSessionID()', () => {
  //   withKiteNotReachable(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () => KiteConnector.canAuthenticateUser());
  //     });
  //   });
  //
  //   withKiteReachable(() => {
  //     describe('and the authentication succeeds', () => {
  //       withRoutes([[
  //         o => /^\/api\/account\/authenticate/.test(o.path),
  //         o => fakeResponse(200, 'authenticated'),
  //       ]]);
  //
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() =>
  //           KiteConnector.authenticateSessionID('key'));
  //       });
  //     });
  //
  //     describe('and the authentication fails', () => {
  //       withRoutes([[
  //         o => /^\/api\/account\/authenticate/.test(o.path),
  //         o => fakeResponse(401),
  //       ]]);
  //
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.authenticateSessionID('key'));
  //       });
  //     });
  //   });
  // });
  //
  // describe('.isPathWhitelisted()', () => {
  //   withKiteNotAuthenticated(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () =>
  //         KiteConnector.isPathWhitelisted('/path/to/dir'));
  //     });
  //   });
  //
  //   withKiteWhitelistedPaths(['/path/to/dir'], () => {
  //     describe('called without a path', () => {
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isPathWhitelisted());
  //       });
  //     });
  //
  //     describe('passing a path not in the whitelist', () => {
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.isPathWhitelisted('/path/to/other/dir'));
  //       });
  //     });
  //
  //     describe('passing a path in the whitelist', () => {
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() =>
  //           KiteConnector.isPathWhitelisted('/path/to/dir'));
  //       });
  //     });
  //   });
  // });
  //
  // describe('.canWhitelistPath()', () => {
  //   withKiteNotAuthenticated(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () =>
  //         KiteConnector.canWhitelistPath('/path/to/dir'));
  //     });
  //   });
  //
  //   withKiteWhitelistedPaths(['/path/to/dir'], () => {
  //     describe('passing a path in the whitelist', () => {
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.canWhitelistPath('/path/to/dir'));
  //       });
  //     });
  //
  //     describe('passing a path not in the whitelist', () => {
  //       it('returns a resolving promise', () => {
  //         return waitsForPromise(() =>
  //           KiteConnector.canWhitelistPath('/path/to/other/dir'));
  //       });
  //     });
  //   });
  // });
  //
  // describe('.whitelistPath()', () => {
  //   withKiteNotAuthenticated(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () =>
  //         KiteConnector.whitelistPath('/path/to/dir'));
  //     });
  //   });
  //
  //   withKiteWhitelistedPaths(['/path/to/dir'], () => {
  //     describe('passing a path in the whitelist', () => {
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.whitelistPath('/path/to/dir'));
  //       });
  //     });
  //
  //     describe('passing a path not in the whitelist', () => {
  //       describe('and the request succeeds', () => {
  //         withRoutes([[
  //           o =>
  //             /^\/clientapi\/permissions\/whitelist/.test(o.path) &&
  //             o.method === 'PUT',
  //           o => fakeResponse(200),
  //         ]]);
  //
  //         it('returns a resolving promise', () => {
  //           return waitsForPromise(() =>
  //           KiteConnector.whitelistPath('/path/to/other/dir'));
  //         });
  //       });
  //
  //       describe('and the request fails', () => {
  //         withRoutes([[
  //           o =>
  //             /^\/clientapi\/permissions\/whitelist/.test(o.path) &&
  //             o.method === 'PUT',
  //           o => fakeResponse(401),
  //         ]]);
  //
  //         it('returns a rejected promise', () => {
  //           return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.whitelistPath('/path/to/other/dir'));
  //         });
  //       });
  //     });
  //   });
  // });
  //
  // describe('.blacklistPath()', () => {
  //   withKiteNotAuthenticated(() => {
  //     it('returns a rejected promise', () => {
  //       return waitsForPromise({shouldReject: true}, () =>
  //         KiteConnector.blacklistPath('/path/to/dir'));
  //     });
  //   });
  //
  //   withKiteWhitelistedPaths(['/path/to/dir'], () => {
  //     describe('passing a path in the whitelist', () => {
  //       it('returns a rejected promise', () => {
  //         return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.blacklistPath('/path/to/dir'));
  //       });
  //     });
  //
  //     describe('passing a path not in the whitelist', () => {
  //       describe('and the request succeeds', () => {
  //         withRoutes([[
  //           o =>
  //             /^\/clientapi\/permissions\/blacklist/.test(o.path) &&
  //             o.method === 'PUT',
  //           o => fakeResponse(200),
  //         ]]);
  //
  //         it('returns a resolving promise', () => {
  //           return waitsForPromise(() =>
  //           KiteConnector.blacklistPath('/path/to/other/dir'));
  //         });
  //       });
  //
  //       describe('and the request fails', () => {
  //         withRoutes([[
  //           o =>
  //             /^\/clientapi\/settings\/inclusions/.test(o.path) &&
  //             o.method === 'PUT',
  //           o => fakeResponse(401),
  //         ]]);
  //
  //         it('returns a rejected promise', () => {
  //           return waitsForPromise({shouldReject: true}, () =>
  //           KiteConnector.blacklistPath('/path/to/other/dir'));
  //         });
  //       });
  //     });
  //   });
  // });
});
