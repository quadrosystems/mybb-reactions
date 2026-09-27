const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Load the real TypeScript utility without adding a test runner dependency.
require.extensions['.tsx'] = require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2016,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
    },
  });
  module._compile(outputText, filename);
};

const emojiMartRoot = path.dirname(require.resolve('emoji-mart/package.json'));
const utilsPath = require.resolve('../src/utils/emoji.ts');
const pickerPath = require.resolve('../src/ReactionPicker.tsx');
const allCategories = ['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'];
const defaultRecent = ['+1', 'grinning', 'kissing_heart', 'heart_eyes', 'laughing',
  'stuck_out_tongue_winking_eye', 'sweat_smile', 'joy', 'scream'];
const custom = [
  { id: '_test', url: 'https://example.invalid/test.png' },
  { id: '_grouped', url: 'https://example.invalid/grouped.png', category: 'Test' },
];

function setup({ include = allCategories, history, last, customEmojis = [] } = {}) {
  // emoji-mart caches history in module scope; each case represents a fresh page.
  Object.keys(require.cache).forEach((filename) => {
    if (filename.startsWith(emojiMartRoot + path.sep) || filename === utilsPath || filename === pickerPath) {
      delete require.cache[filename];
    }
  });
  const emojiMart = require('emoji-mart');
  const utils = require(utilsPath);
  const ReactionPicker = require(pickerPath).default;
  const memory = { frequently: history, last };
  const writes = [];
  const selected = [];
  emojiMart.store.setHandlers({
    getter: (key) => memory[key],
    setter: (key, value) => {
      writes.push(key);
      memory[key] = value;
    },
  });
  const configure = (includeCategories, configuredCustom = customEmojis) => {
    utils.setConfig({ includeCategories, customEmojis: configuredCustom });
  };
  configure(include);

  function renderPicker(disabled = false) {
    // Shallow-render our component with an open state; the library below is real.
    const hooks = { useState: React.useState, useRef: React.useRef, useEffect: React.useEffect };
    React.useState = () => [true, () => {}];
    React.useRef = () => ({ current: null });
    React.useEffect = () => {};
    global.window = { UserLanguage: 'ru' };
    try {
      return ReactionPicker({ disabled, onSelected: (id) => selected.push(id) });
    } finally {
      Object.assign(React, hooks);
      delete global.window;
    }
  }

  function openPicker() {
    const panel = renderPicker().props.children[1];
    assert(panel, 'Expected an available picker');
    const pickerElement = panel.props.children;
    assert.equal(pickerElement.type, emojiMart.Picker);
    const props = pickerElement.props;
    // Use the actual wrapper and category implementation shipped in emoji-mart.
    const element = new emojiMart.Picker(props).render();
    const picker = new element.type(element.props);
    const recentSpec = picker.categories.find(({ id }) => id === 'recent');
    const recent = recentSpec ? new emojiMart.Category({
      ...recentSpec,
      perLine: props.perLine,
      data: picker.data,
      recent: props.recent,
      custom: picker.CUSTOM,
    }).getEmojis() : [];
    const ids = (recent || []).map((emoji) => typeof emoji === 'string' ? emoji : emoji.id);
    ids.forEach((id) => assert(utils.isReactionCodeInConfig(id), `Disabled recent reaction: ${id}`));
    assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(emojiMart.Picker, props)));
    return { ids, picker, props };
  }

  return { emojiMart, utils, configure, openPicker, renderPicker, memory, writes, selected };
}

let passed = 0;
function test(name, run) {
  run();
  passed += 1;
  console.log(`OK ${name}`);
}

test('all categories retain the default recent preset', () => {
  assert.deepEqual(setup().openPicker().ids, defaultRecent);
});

test('disabling people hides the entire default recent preset without crashing', () => {
  const context = setup({ include: allCategories.filter((id) => id !== 'people') });
  const { ids, picker } = context.openPicker();
  assert.deepEqual(ids, []);
  assert(!picker.categories.some(({ id }) => id === 'recent'));
  assert(picker.categories.some(({ id }) => id === 'foods'));
  assert.deepEqual(context.writes, []);
});

test('history is filtered for categories other than people too', () => {
  const context = setup({
    include: allCategories.filter((id) => id !== 'foods'),
    history: { apple: 20, grinning: 5 },
  });
  assert.deepEqual(context.openPicker().ids, ['grinning']);
  assert.deepEqual(context.memory.frequently, { apple: 20, grinning: 5 });
  assert.deepEqual(context.writes, []);
});

test('mixed history keeps allowed normal and custom reactions in frequency order', () => {
  const context = setup({
    include: ['foods'], customEmojis: custom,
    history: { grinning: 20, _removed: 15, _test: 10, apple: 5, _grouped: 2 },
    last: 'grinning',
  });
  assert.deepEqual(context.openPicker().ids, ['_test', 'apple', '_grouped']);
});

test('custom-only configuration keeps both grouped and ungrouped custom reactions', () => {
  const context = setup({
    include: [], customEmojis: custom,
    history: { grinning: 20, _removed: 15, _test: 10, _grouped: 5 },
  });
  const { ids, picker } = context.openPicker();
  assert.deepEqual(ids, ['_test', '_grouped']);
  assert(picker.categories.some(({ id }) => id === 'custom'));
  assert(picker.categories.some(({ id }) => id === 'custom-Test'));
});

test('an empty configuration does not display default reactions', () => {
  const context = setup({ include: [] });
  assert(!context.utils.hasAvailableReactions());
  assert.deepEqual(context.utils.getRecentPickerProps(9).recent, []);
  assert.equal(context.renderPicker().props.children[1], false);
});

test('an explicitly empty stored history does not crash the picker', () => {
  assert.deepEqual(setup({ history: {} }).openPicker().ids, []);
});

test('new selections appear on reopening with emoji-mart history handling preserved', () => {
  const context = setup({ include: ['foods'], customEmojis: custom });
  assert.deepEqual(context.openPicker().ids, []);
  context.openPicker().props.onSelect({ id: 'apple' });
  assert.deepEqual(context.openPicker().ids, ['apple']);
  context.openPicker().props.onSelect({ id: '_test' });
  assert.deepEqual(context.openPicker().ids, ['_test', 'apple']);
  assert.deepEqual(context.selected, ['apple', '_test']);
});

test('a disabled selection is not sent or added to history', () => {
  const context = setup({ include: ['foods'] });
  const { props } = context.openPicker();
  props.onSelect({ id: 'grinning' });
  props.onSelect({ id: '_removed' });
  props.onSelect({ id: '-1' });
  assert.deepEqual(context.selected, []);
  assert.deepEqual(context.writes, []);
});

test('the most recent allowed selection remains visible outside the top history entries', () => {
  const history = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`_removed${i}`, 100 - i]));
  history.apple = 1;
  assert.deepEqual(setup({ include: ['foods'], history, last: 'apple' }).openPicker().ids, ['apple']);
});

test('configuration changes preserve history and the shared emoji dataset', () => {
  const context = setup({ history: { grinning: 20, apple: 5, _test: 1 }, customEmojis: custom });
  const data = require('emoji-mart/data/all.json');
  const originalData = JSON.stringify(data);
  assert.deepEqual(context.openPicker().ids, ['grinning', 'apple', '_test']);
  context.configure(['foods'], []);
  assert.deepEqual(context.openPicker().ids, ['apple']);
  context.configure(allCategories);
  assert.deepEqual(context.openPicker().ids, ['grinning', 'apple', '_test']);
  assert.equal(JSON.stringify(data), originalData);
  assert.deepEqual(context.writes, []);
});

test('the full dataset stays available for emoji-mart special search queries', () => {
  const context = setup({ include: ['foods'] });
  context.openPicker();
  // emoji-mart 3.0.1 dereferences -1 directly, regardless of includeCategories.
  assert.doesNotThrow(() => context.emojiMart.emojiIndex.search('-1'));
  assert(!context.utils.isReactionCodeInConfig('-1'));
});

console.log(`${passed} recent reaction checks passed.`);
