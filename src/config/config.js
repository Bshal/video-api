module.exports = {
	development: {
		dialect: 'sqlite',
		storage: 'path/to/dev.sqlite',
	},
	test: {
		dialect: 'sqlite',
		storage: ':memory:',
	},
	production: {
		dialect: 'sqlite',
		storage: 'path/to/prod.sqlite',
	},
}
