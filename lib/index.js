import dependencyChecker from './dependencyChecker';
import Instance from './instance';

export default {
  async init(input) {
    await dependencyChecker.assertAll();
    return new Instance(input);
  },
};
