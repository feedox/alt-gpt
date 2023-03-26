module.exports = {
	roots: [
	  "<rootDir>"
	],
	transform: {
		"^.+\\.jsx?$": "babel-jest",
	  	"^.+\\.ts?$": "ts-jest"
	},
	testRegex: "(/__tests__/.*|/tests/.*(\\.|/)(test|spec))\\.ts$",
	moduleFileExtensions: [
	  "ts",
	  "tsx",
	  "js",
	  "jsx",
	  "json",
	  "node"
	],
	verbose: true,
	reporters: [ "default", "jest-junit" ],
	coverageDirectory: ".tmp/coverage"
}