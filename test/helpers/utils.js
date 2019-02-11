'use strict';

const merge = (a, b) => {
  const c = {};
  for (const k in a) { c[k] = a[k]; }
  for (const k in b) { c[k] = b[k]; }
  return c;
};

const customEnv = (env, addObj, delArr) => {
  const custom = Object.assign(env, addObj);
  delArr.forEach(key => {
    delete custom[key];
  });
  return {env: custom};
};

module.exports = {
  merge,
  customEnv,
};
