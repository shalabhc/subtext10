import { compile, expectCompiling, expectDump } from './basic.test';

/** @module
 *
 * update tests
 */

test('write update', () => {
  let w = compile("a: 0");
  w.writeAt('a', 1);
  expect(w.dumpAt('a')).toEqual(1);
  expect(() => { w.writeAt('a', 'foo') }).toThrow('changing type of value')
});

test('choice update', () => {
  let w = compile("a: choice{x?: 0; y?: 'foo'}");
  w.writeAt('a', 'y');
  w.writeAt('a.y', 'bar');
  expect(w.dumpAt('a')).toEqual({y: 'bar'});
});

test('update readonly', () => {
  let w = compile("a = 0");
  expect(() => { w.writeAt('a', 1) }).toThrow('unwritable location')
});

test('update type check', () => {
  let w = compile("a: 0");
  expect(() => { w.writeAt('a', 'foo') }).toThrow('changing type of value')
});

test('updatable output', () => {
  let w = compile("c: 0, f =|> c update{write -> c}");
  expect(w.dumpAt('f')).toEqual(0);
  w.writeAt('f', '100');
  expect(w.dumpAt('c')).toEqual(100);
});

test('updatable output ends with update', () => {
  expectCompiling("c: 0, f =|> c")
    .toThrow('updatable output requires update block');
});
test('update block ends with write', () => {
  expectCompiling("c: 0, f =|> c update{0}")
    .toThrow('update block must end with write');
});

test('write type check', () => {
  expectCompiling("c: 0, f =|> c update{write 'foo' -> c}")
    .toThrow('write changing type');
});

test('write order check', () => {
  expectCompiling("c: 0, f =|> c update{write -> g}, g: 0")
    .toThrow('write must go backwards');
});
