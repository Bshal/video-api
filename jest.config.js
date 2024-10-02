module.exports = {
	testEnvironment: 'node',
	setupFilesAfterEnv: ['./jest.setup.js'],
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
	},
	testMatch: [
		'**/src/tests/unit/**/*.test.js',
		'**/src/tests/e2e/**/*.test.js',
	],
	testTimeout: 30000,
}
