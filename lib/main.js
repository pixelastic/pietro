import dependencyChecker from './dependencyChecker.js';
import Instance from './instance.js';

export default {
  async init(input) {
    await dependencyChecker.assertAll();
    return new Instance(input);
  },
};
