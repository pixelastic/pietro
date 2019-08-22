const a = require('./build/dependencyChecker.js').default;

(async function() {
  await a.assertAll();
})();
