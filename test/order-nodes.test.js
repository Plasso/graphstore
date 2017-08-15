/* @flow */

import { orderNodes } from '../src';

test('if orders nodes', () => {
  const nodes = orderNodes(['1', '2', '3'], [{ id: '3' }, { id: '2' }, { id: '1' }]);

  expect(nodes[0].id).toBe('1');
  expect(nodes[1].id).toBe('2');
  expect(nodes[2].id).toBe('3');
});

test('if orders nodes with missing nodes', () => {
  const nodes = orderNodes(['1', '2', '3'], [{ id: '3' }, null, { id: '1' }]);

  expect(nodes[0].id).toBe('1');
  expect(nodes[1]).toBeNull();
  expect(nodes[2].id).toBe('3');
});

