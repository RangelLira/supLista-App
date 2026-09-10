/* eslint-env jest */
// ===========================
// SETUP GLOBAL DE TESTES
// ===========================
// Mocka os módulos nativos que o app carrega no boot (AsyncStorage, Firebase,
// Google Sign-In, Clipboard, SVG). Sem isto, importar App.tsx numa suíte
// derruba tudo com "NativeModule: X is null".

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock'),
);

jest.mock('@react-native-google-signin/google-signin', () => ({
  __esModule: true,
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({
      type: 'success',
      data: { idToken: 'mock-token', user: { name: 'Test User', email: 'test@example.com' } },
    })),
    signOut: jest.fn(async () => {}),
    revokeAccess: jest.fn(async () => {}),
    getCurrentUser: jest.fn(() => null),
  },
  GoogleSigninButton: 'GoogleSigninButton',
  isCancelledResponse: jest.fn(() => false),
  isSuccessResponse: jest.fn(r => !!r && r.type === 'success'),
  statusCodes: {},
}));

jest.mock('@react-native-firebase/auth', () => {
  const authMock = () => ({
    onAuthStateChanged: cb => { if (cb) cb(null); return () => {}; },
    currentUser: null,
    signInWithCredential: jest.fn(async () => ({})),
    signOut: jest.fn(async () => {}),
  });
  authMock.GoogleAuthProvider = { credential: jest.fn(() => ({ providerId: 'google.com' })) };
  return { __esModule: true, default: authMock };
});

jest.mock('@react-native-firebase/firestore', () => {
  const chain = {};
  Object.assign(chain, {
    collection: jest.fn(() => chain),
    doc: jest.fn(() => chain),
    where: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    onSnapshot: jest.fn(() => () => {}),
    get: jest.fn(async () => ({ docs: [], forEach: () => {}, data: () => undefined, exists: false })),
    set: jest.fn(async () => {}),
    update: jest.fn(async () => {}),
    delete: jest.fn(async () => {}),
    add: jest.fn(async () => ({ id: 'mock-id' })),
  });
  const firestoreMock = () => chain;
  firestoreMock.batch = () => ({
    set: jest.fn(), update: jest.fn(), delete: jest.fn(), commit: jest.fn(async () => {}),
  });
  firestoreMock.runTransaction = jest.fn(async updateFn =>
    updateFn({
      get: jest.fn(async () => ({ data: () => undefined, exists: false })),
      set: jest.fn(), update: jest.fn(), delete: jest.fn(),
    }),
  );
  firestoreMock.FieldValue = { serverTimestamp: jest.fn(), delete: jest.fn() };
  return { __esModule: true, default: firestoreMock };
});

jest.mock('react-native-qrcode-svg', () => 'QRCode');

jest.mock('react-native-svg', () => {
  const React = require('react');
  const stub = name => {
    const C = ({ children, ...props }) => React.createElement(name, props, children);
    C.displayName = name;
    return C;
  };
  return {
    __esModule: true,
    default: stub('Svg'),
    Svg: stub('Svg'), Path: stub('Path'), Circle: stub('Circle'), Rect: stub('Rect'),
    G: stub('G'), Defs: stub('Defs'), Line: stub('Line'), Polygon: stub('Polygon'),
    LinearGradient: stub('LinearGradient'), Stop: stub('Stop'), Text: stub('SvgText'),
  };
});
