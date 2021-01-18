module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts)",
    "**/?(*.)+(spec|test).+(ts)"
  ],
  "transform": {
    "^.+\\.(js)$": "babel-jest",
    "^.+\\.(ts)$": "<rootDir>/node_modules/ts-jest/preprocessor.js"
  },
}