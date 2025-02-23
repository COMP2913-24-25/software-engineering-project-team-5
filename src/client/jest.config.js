module.exports = {
    testEnvironment: "jsdom",
    moduleFileExtensions: ["js", "jsx"],
    transform: {
      "^.+\\.(js|jsx)$": "babel-jest",
    },
    setupFilesAfterEnv: ["@testing-library/jest-dom"],
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "jest-css-modules",
    },
  };