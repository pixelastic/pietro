import config from 'aberlaas/configs/vite';

export default {
  ...config,
  test: {
    ...config.test,
    // Global setup - runs once before all tests
    globalSetup: './vite.globalSetup.js',
    // Use forks pool for test isolation (important for Docker-based tests)
    pool: 'forks',
    // In Vitest 4, poolOptions are now top-level options
    singleFork: false, // Enable parallelization
    // Increase timeout for Docker operations
    testTimeout: 30000, // 30 seconds
    hookTimeout: 10000, // 10 seconds for beforeAll/afterAll hooks
  },
};
