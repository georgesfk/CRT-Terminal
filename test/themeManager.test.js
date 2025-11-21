const tm = require('../src/themeManager');

describe('themeManager', () => {
  test('sets and retrieves themes', () => {
    const themes = [{id:'a', name:'A'},{id:'b',name:'B'}];
    tm.setThemes(themes);
    expect(tm.getAll()).toEqual(themes);
    expect(tm.getThemeById('a').name).toBe('A');
    expect(tm.getThemeByName('B').id).toBe('b');
  });
});
