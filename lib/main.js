const dependencyChecker = require('./dependencyChecker');
const Instance = require('./instance');

module.exports = {
  async init(input) {
    await dependencyChecker.assertAll();
    return new Instance(input);
  },
};
