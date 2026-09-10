/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('monta a árvore inteira sem erro e renderiza conteúdo', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  // deixa o boot assíncrono (loadSettings/loadLists/loadCatalog) assentar
  await ReactTestRenderer.act(async () => {});

  // sem nada no AsyncStorage mockado, o app cai no onboarding — deve haver texto
  expect(tree!.root.findAllByType(Text).length).toBeGreaterThan(0);
});
