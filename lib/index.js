/* eslint-disable no-process-exit */
// import { _ } from 'golgoth';
// import os from 'os';
// import fs from 'fs-extra';
// import path from 'path';
// import chalk from 'chalk';
// import firost from 'firost';
// import ProgressBar from 'progress';
// import pMap from 'p-map';
// import which from 'which';
// const cpuCount = os.cpus().length;

export default {
  init(input) {
  },
  /**
   * Check that all the required binaries are installed.
   * Will display the list of missing dependencies in case of failure
   * @returns {Boolean} True if all is installed, false otherwise
   **/
  checkDependencies() {
  },
}

const module = {
  init(inputPath) {
    return {
      path: path.resolve(inputPath),
      ...instance,
    };
  },
};

export default _.bindAll(module, _.functions(module));
