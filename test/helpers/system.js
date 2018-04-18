'use strict';

let WindowsSupport;

const os = require('os');
const {fakeCommands} = require('./child_process');

// This ensure that the env variables required by the
// windows support object are available even on another platform.
if (os.platform() !== 'win32') {
  process.env.TMP = os.tmpdir();
  process.env.ProgramW6432 = os.tmpdir();
  process.env.LOCALAPPDATA = os.tmpdir();
}

function fakeKiteInstallPaths(platform) {
  let safePaths, commandsRestore;
  beforeEach(() => {
    switch (platform) {
      case 'darwin':
        commandsRestore = fakeCommands({
          'mdfind': (ps) => {
            ps.stdout('');
            return 0;
          },
        });
        break;
      case 'win32':
        commandsRestore = fakeCommands({
          'tasklist': (ps) => {
            ps.stdout('');
            return 0;
          },
          'C:\\Windows\\Kite.exe': (ps) => {
            ps.stdout('');
            return 1;
          },
        });
        if (!WindowsSupport) {
          WindowsSupport = require('../../lib/support/windows');
        }
        safePaths = WindowsSupport.KITE_EXE_PATH;
        WindowsSupport.KITE_EXE_PATH = 'C:\\Windows\\Kite.exe';
        break;
    }
  });

  afterEach(() => {
    commandsRestore && commandsRestore.restore();
    switch (platform) {
      case 'win32':
        WindowsSupport.KITE_EXE_PATH = safePaths;
        break;
    }
  });
}

function withKiteInstalled(platform, block) {
  let commandsRestore;
  describe('with kite installed', () => {
    fakeKiteInstallPaths(platform);

    beforeEach(() => {
      switch (platform) {
        case 'darwin':
          commandsRestore = fakeCommands({
            'mdfind': (ps, args) => {
              const [, key] = args[0].split(/\s=\s/);
              key === '"com.kite.Kite"'
                ? ps.stdout('/Applications/Kite.app')
                : ps.stdout('');
              return 0;
            },
          });
          break;
        case 'win32':
          commandsRestore = fakeCommands({
            [__filename]: (ps) => {
              ps.stdout('');
              return 0;
            },
          });
          if (!WindowsSupport) {
            WindowsSupport = require('../lib/support/windows');
          }
          WindowsSupport.KITE_EXE_PATH = __filename;
          break;
      }
    });

    afterEach(() => {
      commandsRestore && commandsRestore.restore();
    });

    block();
  });
}

function withKiteEnterpriseInstalled(platform, block) {
  let commandsRestore;

  describe('with kite enterprise installed', () => {
    fakeKiteInstallPaths(platform);

    beforeEach(() => {
      switch (platform) {
        case 'darwin':
          commandsRestore = fakeCommands({
            'mdfind': (ps, args) => {
              const [, key] = args[0].split(/\s=\s/);
              key === '"enterprise.kite.Kite"'
                ? ps.stdout('/Applications/KiteEnterprise.app')
                : ps.stdout('');
              return 0;
            },
          });
          break;
        case 'win32':
          if (!WindowsSupport) {
            WindowsSupport = require('../lib/support/windows');
          }
          WindowsSupport.KITE_EXE_PATH = __filename;
          break;
      }
    });

    afterEach(() => {
      commandsRestore && commandsRestore.restore();
    });

    block();
  });
}

function withBothKiteInstalled(platform, block) {
  let commandsRestore;
  describe('with both kite and kite enterprise installed', () => {
    fakeKiteInstallPaths(platform);

    beforeEach(() => {
      switch (platform) {
        case 'darwin':
          commandsRestore = fakeCommands({
            'mdfind': (ps, args) => {
              const [, key] = args[0].split(/\s=\s/);
              key === '"enterprise.kite.Kite"'
                ? ps.stdout('/Applications/KiteEnterprise.app')
                : ps.stdout('/Applications/Kite.app');
              return 0;
            },
          });
          break;
        case 'win32':
          if (!WindowsSupport) {
            WindowsSupport = require('../lib/support/windows');
          }
          WindowsSupport.KITE_EXE_PATH = __filename;
          break;
      }
    });

    afterEach(() => {
      commandsRestore && commandsRestore.restore();
    });

    block();
  });
}

function withKiteRunning(platform, block) {
  withKiteInstalled(platform, () => {
    describe(', running', () => {
      beforeEach(() => {
        switch (platform) {
          case 'darwin':
            fakeCommands({
              '/bin/ps': (ps) => {
                ps.stdout('Kite');
                return 0;
              },
            });
            break;
          case 'win32':
            fakeCommands({
              'tasklist': (ps) => {
                ps.stdout('kited.exe');
                return 0;
              },
            });
            break;
        }
      });

      block();
    });
  });
}

function withKiteNotRunning(platform, block) {
  withKiteInstalled(platform, () => {
    describe(', not running', () => {
      beforeEach(() => {
        switch (platform) {
          case 'darwin':
            fakeCommands({
              '/bin/ps': (ps) => {
                ps.stdout('');
                return 0;
              },
              defaults: () => 0,
              open: () => 0,
            });
            break;
          case 'win32':
            fakeCommands({
              'tasklist': (ps) => {
                ps.stdout('');
                return 0;
              },
              [WindowsSupport.KITE_EXE_PATH]: () => 0,
            });
            break;
        }
      });

      block();
    });
  });
}

function withKiteEnterpriseRunning(platform, block) {
  withKiteEnterpriseInstalled(platform, () => {
    describe(', running', () => {
      beforeEach(() => {
        switch (platform) {
          case 'darwin':
            fakeCommands({
              '/bin/ps': (ps) => {
                ps.stdout('KiteEnterprise');
                return 0;
              },
            });
            break;
          case 'win32':
            fakeCommands({
              'tasklist': (ps) => {
                ps.stdout('kited.exe');
                return 0;
              },
            });
            break;
        }
      });

      block();
    });
  });
}

function withKiteEnterpriseNotRunning(platform, block) {
  withKiteEnterpriseInstalled(platform, () => {
    describe(', not running', () => {
      beforeEach(() => {
        switch (platform) {
          case 'darwin':
            fakeCommands({
              '/bin/ps': (ps) => {
                ps.stdout('');
                return 0;
              },
              defaults: () => 0,
              open: () => 0,
            });
            break;
          case 'win32':
            fakeCommands({
              'tasklist': (ps) => {
                ps.stdout('');
                return 0;
              },
              [WindowsSupport.KITE_EXE_PATH]: () => 0,
            });
            break;
        }
      });

      block();
    });
  });
}


module.exports = {
  fakeKiteInstallPaths,
  withBothKiteInstalled,
  withKiteEnterpriseInstalled,
  withKiteEnterpriseNotRunning,
  withKiteEnterpriseRunning,
  withKiteInstalled,
  withKiteNotRunning,
  withKiteRunning,
};
