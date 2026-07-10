/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [0],
    'scope-enum': [1, 'always', ['frontend', 'backend', 'deps', 'ci', 'config', 'release', 'repo']],
  },
};
