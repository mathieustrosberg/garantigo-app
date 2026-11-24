// Native gestures do not exist in Jest: use the mocks shipped with the library.
require('react-native-gesture-handler/jestSetup');

// Worklets run on a native thread that does not exist in Jest: use the official mock.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));

// The phone storage does not exist in Jest: the official mock keeps the values in memory.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Animations are replaced by their final values so that tests stay deterministic.
require('react-native-reanimated').setUpTests();
