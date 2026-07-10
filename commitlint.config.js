/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Encourage a scope but do not require one.
    'scope-empty': [0],
    // Allow the common scopes in this monorepo.
    'scope-enum': [1, 'always', ['frontend', 'backend', 'deps', 'ci', 'config', 'release', 'repo']],
  },
};
