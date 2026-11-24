import { datasets, exercises, learning, modules, sources, tracks } from './curriculum.js';
import { concepts, createConcept, mountHeroPlot } from './concepts.js';

const $ = id => document.getElementById(id);
const storageKey = 'hr-pandas-practice-v1';
let progress = {};
let storageAvailable = true;
try {
  progress = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
} catch {
  storageAvailable = false;
}
const isPassed = id => Boolean(progress[id]?.passed);
const editor = $('code');
const result = $('result');
const lastResults = new Map();
let selected = exercises[0];
let page = 'home';
const pages = ['home', 'practice', 'catalog', 'concepts', 'guide'];
const conceptByExercise = [
  ['loop', [56, 57, 58, 60, 62]],
  ['axis', [70, 74, 75, 76, 82, 83]],
  ['broadcast', [84, 85, 86, 90]],
  ['join', [28, 29, 34]],
  ['group', [17, 18, 19, 20, 21, 153, 157]],
  ['interval', [109, 111, 112, 113]],
  ['regression', [121, 123, 124]],
  ['matmul', [129, 134, 135, 136]],
  ['projection', [141, 142, 145, 146]],
  ['pca', [148, 149, 150, 151, 152]],
];
let conceptTrack = '';
let worker;
let workerReady = false;
const readyLibraries = new Set();
let job;
let timeout;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function remember(id, updates) {
  progress[id] = { ...progress[id], ...updates };
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  $('saved-label').textContent = storageAvailable ? '草稿自動儲存' : '此瀏覽器無法儲存草稿';
}

function showProgress() {
  const count = exercises.filter(item => isPassed(item.id)).length;
  $('progress').max = exercises.length;
  $('progress').value = count;
  $('progress-label').textContent = count + ' / ' + exercises.length + ' 題';
  $('home-start').textContent = count > 0 && count < exercises.length ? '繼續練習' : '開始第一題';
  const progressButton = (key, title, i, isTrack) => {
    const field = isTrack ? 'track' : 'module';
    const items = exercises.filter(item => item[field] === key);
    const passed = items.filter(item => isPassed(item.id)).length;
    const button = element('button', undefined, isTrack ? 'module-button track-button' : 'module-button');
    button.type = 'button';
    if (selected[field] === key) button.setAttribute('aria-current', 'true');
    button.append(element('span', String(i + 1).padStart(2, '0'), 'module-number'),
      element('span', title), element('span', passed + '/' + items.length, 'module-count'));
    button.addEventListener('click', () => {
      navigate('practice', (items.find(item => !isPassed(item.id)) || items[0]).id);
    });
    return button;
  };
  $('tracks').replaceChildren(...tracks.map(([key, title], i) => progressButton(key, title, i, true)));
  $('modules').replaceChildren(...modules.filter(([, , , track]) => track === selected.track)
    .map(([key, title], i) => progressButton(key, title, i, false)));
}

function dataLiteral(value, missing = 'None') {
  if (value === null) return missing;
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return '[' + value.map(v => dataLiteral(v, missing)).join(', ') + ']';
  if (typeof value === 'object') {
    return '{' + Object.entries(value).map(([key, entry]) =>
      JSON.stringify(key) + ': ' + dataLiteral(entry, missing)).join(', ') + '}';
  }
  return JSON.stringify(value);
}

function renderDataset(key) {
  const data = datasets[key];
  const container = element('div', undefined, 'dataset');
  const label = element('p', undefined, 'dataset-meta');
  const kind = 'array' in data ? 'ndarray' : 'value' in data ? 'Python 值' :
    'text' in data ? 'CSV 字串' : data.rows.length + ' 列 × ' + data.names.length + ' 欄';
  label.append(element('code', key), ' · ' + kind);
  if (data.label) label.append(element('span', data.label, 'input-meaning'));
  const wrap = element('div', undefined, 'data-wrap');
  if ('value' in data || 'array' in data) {
    const raw = data.value ?? data.array;
    const missing = 'array' in data ? 'NaN' : 'None';
    if (typeof raw === 'string' && raw.includes('\n')) {
      wrap.append(element('pre', raw.trimEnd()));
    } else if (Array.isArray(raw) && raw[0] && typeof raw[0] === 'object') {
      wrap.append(element('pre', '[\n  ' + raw.map(entry => dataLiteral(entry, missing)).join(',\n  ') + '\n]'));
    } else {
      wrap.append(element('pre', dataLiteral(raw, missing)));
      if (typeof raw !== 'object') container.classList.add('scalar-data');
    }
  } else if ('text' in data) {
    wrap.append(element('pre', data.text.trimEnd()));
  } else {
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', key + ' 的資料表，可橫向捲動');
    const table = element('table');
    table.setAttribute('aria-label', key + ' 的範例資料');
    const header = table.createTHead().insertRow();
    for (const name of ['index', ...data.names]) {
      const cell = element('th', name);
      cell.scope = 'col';
      header.append(cell);
    }
    const body = table.createTBody();
    for (const [index, values] of data.rows.entries()) {
      const row = body.insertRow();
      for (const value of [index, ...values]) {
        const cell = row.insertCell();
        cell.textContent = value ?? '缺值';
        if (value === null) cell.className = 'missing';
        if (typeof value === 'string' && value !== value.trim()) cell.textContent = JSON.stringify(value);
      }
    }
    wrap.append(table);
  }
  container.append(label, wrap);
  return container;
}

function renderExercise() {
  const trackIndex = tracks.findIndex(([key]) => key === selected.track);
  const module = modules.find(([key]) => key === selected.module);
  const index = exercises.indexOf(selected);
  $('module-number').textContent = String(trackIndex + 1).padStart(2, '0');
  $('module-name').textContent = tracks[trackIndex][1] + ' ／ ' + module[1];
  $('module-description').textContent = module[2];
  $('exercise-title').textContent = String(selected.number).padStart(2, '0') + '. ' + selected.title;
  for (const id of ['api', 'story', 'spec', 'example', 'hint', 'solution', 'note']) {
    $(id).textContent = selected[id];
  }
  $('note').hidden = !selected.note;
  const [sourceTitle, sourceUrl] = sources[selected.source];
  $('doc-link').href = sourceUrl;
  $('doc-link').textContent = '閱讀來源 · ' + sourceTitle;
  const inputNodes = selected.inputs.map(renderDataset);
  $('datasets').classList.toggle('scalar-grid', inputNodes.every(node => node.classList.contains('scalar-data')));
  $('datasets').replaceChildren(...inputNodes);
  const related = conceptByExercise.find(([, ids]) => ids.includes(selected.id));
  const diagrams = $('practice-concepts');
  diagrams.hidden = !related;
  diagrams.replaceChildren(...(related ? [createConcept(related[0], { inline: true })] : []));
  document.querySelectorAll('.support details').forEach(detail => { detail.open = false; });
  $('previous').disabled = index === 0;
  $('next').disabled = index === exercises.length - 1;
  $('saved-label').textContent = storageAvailable ? '草稿自動儲存' : '此瀏覽器無法儲存草稿';
  setCode(progress[selected.id]?.code ?? selected.starter);
  renderResult(lastResults.get(selected.id));
}

function renderCatalog() {
  const query = $('search').value.trim().toLowerCase();
  const track = $('filter-track').value;
  const module = $('filter-module').value;
  const status = $('filter-status').value;
  const matching = exercises.filter(item =>
    (!query || (item.number + ' ' + item.title + ' ' + item.api).toLowerCase().includes(query)) &&
    (!track || item.track === track) &&
    (!module || item.module === module) &&
    (!status || isPassed(item.id) === (status === 'passed')));
  $('catalog-list').replaceChildren(...matching.map(item => {
    const button = element('button', undefined, 'catalog-row');
    button.type = 'button';
    button.append(element('span', String(item.number).padStart(2, '0')),
      element('strong', item.title), element('code', item.api),
      element('span', isPassed(item.id) ? '已通過' : '未通過', isPassed(item.id) ? 'passed' : ''));
    button.addEventListener('click', () => navigate('practice', item.id));
    return button;
  }));
  $('catalog-count').textContent = matching.length + ' / ' + exercises.length + ' 題';
  if (!matching.length) $('catalog-list').append(element('p', '找不到符合條件的題目。', 'empty-list'));
}

function renderGuide() {
  $('learning-paths').replaceChildren(...tracks.map(([key, title, description, cases]) => {
    const items = exercises.filter(item => item.track === key);
    const section = element('section', undefined, 'card guide-card learning-card');
    section.append(element('h2', title + ' · ' + items.length + ' 題'), element('p', description),
      element('p', '實作情境 · ' + cases, 'case-line'));
    const list = element('ol');
    for (const [lesson, text, source] of learning[key]) {
      const entry = element('li');
      const link = element('a', sources[source][0], 'doc-link');
      link.href = sources[source][1];
      link.target = '_blank';
      link.rel = 'noopener';
      entry.append(element('strong', lesson), element('p', text), link);
      list.append(entry);
    }
    section.append(list);
    const button = element('button', '開始練習 ' + title, 'button secondary');
    button.type = 'button';
    button.addEventListener('click', () => navigate('practice', (items.find(item => !isPassed(item.id)) || items[0]).id));
    section.append(button);
    const visual = element('button', '看概念圖', 'button secondary');
    visual.type = 'button';
    visual.addEventListener('click', () => {
      conceptTrack = key;
      navigate('concepts');
    });
    section.append(' ', visual);
    return section;
  }));
}

function renderHome() {
  const symbols = ['{ }', '▦', '▤', 'σ', '⟂'];
  $('home-tracks').replaceChildren(...tracks.map(([key, title, , cases], index) => {
    const items = exercises.filter(item => item.track === key);
    const button = element('button', undefined, 'home-track');
    const icon = element('span', symbols[index], 'home-track-icon');
    icon.setAttribute('aria-hidden', 'true');
    button.type = 'button';
    button.append(icon, element('strong', title), element('span', cases, 'track-cases'),
      element('small', items.length + ' 題'));
    button.addEventListener('click', () => navigate('practice',
      (items.find(item => !isPassed(item.id)) || items[0]).id));
    return button;
  }));
  mountHeroPlot($('hero-plot'));
}

function renderConcepts() {
  for (const button of $('concept-filters').children) {
    button.setAttribute('aria-pressed', String(button.dataset.track === conceptTrack));
  }
  $('concept-gallery').replaceChildren(...concepts
    .filter(([, track]) => !conceptTrack || track === conceptTrack)
    .map(([id]) => createConcept(id, { practice: exercise => navigate('practice', exercise) })));
}

function navigate(target, id = selected.id, historyMode = 'push') {
  if (historyMode && job && (target !== 'practice' || id !== selected.id)) {
    stopJob('已停止上一題的執行。');
  }
  const changed = page !== target || selected.id !== id;
  page = target;
  document.body.dataset.view = target;
  selected = exercises.find(item => item.id === id) || exercises[0];
  const hash = target === 'practice' ? '#practice/' + selected.id : '#' + target;
  if (historyMode === 'push' && location.hash !== hash) history.pushState(null, '', hash);
  if (historyMode === 'replace') history.replaceState(null, '', hash);
  for (const name of pages) $(name).hidden = name !== target;
  document.querySelectorAll('[data-page]').forEach(button => {
    if (button.dataset.page === target) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  showProgress();
  if (target === 'practice') renderExercise();
  if (target === 'catalog') renderCatalog();
  if (target === 'concepts') renderConcepts();
  if (changed && historyMode === 'push') $(target).querySelector('h1').focus({ preventScroll: true });
  if (changed) window.scrollTo(0, 0);
}

function readLocation(initial = false) {
  const [target, id] = location.hash.slice(1).split('/');
  const route = pages.includes(target) ? target : 'home';
  if (!initial && job && (route !== 'practice' || Number(id) !== selected.id)) stopJob('已停止上一題的執行。');
  navigate(route, Number(id) || selected.id, initial ? 'replace' : null);
}

function setTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  $('theme-toggle').setAttribute('aria-pressed', String(dark));
  $('theme-icon').textContent = dark ? '☀' : '☾';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0d1628' : '#edf3f5';
}

setTheme(document.documentElement.dataset.theme || 'light');
$('theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('hr-analytics-theme', theme); } catch {}
});
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
systemTheme.addEventListener('change', event => {
  try { if (localStorage.getItem('hr-analytics-theme')) return; } catch {}
  setTheme(event.matches ? 'dark' : 'light');
});

const tokens = /#[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|___|\b(?:True|False|None|lambda|from|import|as|for|if|else|in|not|and|or|def|return)\b|\b\d+(?:\.\d+)?\b/g;

function highlightCode() {
  const text = editor.value;
  const fragments = [];
  let cursor = 0;
  for (const match of text.matchAll(tokens)) {
    const token = match[0];
    fragments.push(document.createTextNode(text.slice(cursor, match.index)));
    let kind = 'keyword';
    if (token.startsWith('#')) kind = 'comment';
    else if (token.startsWith('"') || token.startsWith("'")) kind = 'string';
    else if (token === '___') kind = 'fill';
    else if (/^\d/.test(token)) kind = 'number';
    fragments.push(element('span', token, 'token-' + kind));
    cursor = match.index + token.length;
  }
  fragments.push(document.createTextNode(text.slice(cursor) + '\n'));
  $('highlight').replaceChildren(...fragments);
  $('line-numbers').textContent = text.split('\n').map((_, i) => i + 1).join('\n') + '\n';
  scrollCode();
}

function scrollCode() {
  $('highlight').scrollLeft = editor.scrollLeft;
  $('highlight').scrollTop = editor.scrollTop;
  $('line-numbers').scrollTop = editor.scrollTop;
}

function setCode(value) {
  editor.value = value;
  editor.scrollTop = 0;
  editor.scrollLeft = 0;
  highlightCode();
}

function changeCode(value) {
  setCode(value);
  remember(selected.id, { code: value });
  lastResults.delete(selected.id);
  renderResult();
  editor.focus();
}

function runtimeStatus(state, message) {
  $('runtime-label').textContent = message;
  $('runtime-label').parentElement.dataset.state = state;
}

function toggleBusy(busy) {
  for (const id of ['run', 'submit', 'show-expected', 'reset', 'apply-solution']) $(id).disabled = busy;
  editor.readOnly = busy;
  $('stop').hidden = !busy;
}

function output(label, value) {
  const section = element('div', undefined, 'output');
  section.append(element('h3', label), element('pre', value));
  return section;
}

function renderResult(info) {
  result.replaceChildren();
  if (!info) {
    const message = isPassed(selected.id) ? '這題已通過。你可以重練，或前往下一題。' : '按「執行」看輸出，再按「提交答案」檢查兩組資料。';
    result.append(element('p', message));
    return;
  }
  const messages = {
    loading: ['正在載入 Python 執行環境…', '首次執行或切換到需要新套件的題目時，請等候下載。'],
    working: ['正在執行程式…'],
    ran: ['已執行範例', '可以比對輸出，準備好後按「提交答案」。'],
    example: ['範例資料的預期輸出'],
    passed: ['通過 · 2 / 2 組測試', '範例資料和另一組資料都符合題意。'],
    mismatch: ['範例資料未通過', '先比對列數、欄名、值和順序。'],
    alternate: ['通過 · 1 / 2 組測試', '範例正確。請檢查有沒有寫死列數、員工編號或其他範例值。'],
    error: ['程式需要修正'],
    failure: ['無法執行', info.message],
    stopped: ['已停止', info.message],
  };
  const [label, detail] = messages[info.status];
  const tone = info.status === 'passed' ? 'success' :
    ['mismatch', 'alternate', 'error', 'failure'].includes(info.status) ? 'failure' : '';
  result.append(element('p', label, tone));
  if (detail) result.append(element('p', detail));
  const columns = element('div', undefined, 'output-grid');
  if (info.actual !== undefined) columns.append(output('你的輸出', info.actual));
  if (info.expected !== undefined) columns.append(output('預期輸出', info.expected));
  if (columns.childElementCount) result.append(columns);
  if (info.stdout) result.append(output('print() 輸出', info.stdout));
  if (info.message && ['mismatch', 'error'].includes(info.status)) result.append(output('檢查訊息', info.message));
}

function releaseWorker() {
  worker?.terminate();
  worker = undefined;
  workerReady = false;
  readyLibraries.clear();
}

function finish(info) {
  if (!job) return;
  clearTimeout(timeout);
  const id = job.id;
  job = undefined;
  lastResults.set(id, info);
  toggleBusy(false);
  if (info.status === 'passed') {
    remember(id, { passed: true });
    showProgress();
  }
  if (selected.id === id && page === 'practice') renderResult(info);
}

function stopJob(message) {
  releaseWorker();
  runtimeStatus('idle', 'Python 待啟動');
  finish({ status: 'stopped', message });
}

function fail(message, runtimeMessage = 'Python 載入失敗') {
  releaseWorker();
  runtimeStatus('error', runtimeMessage);
  finish({ status: 'failure', message });
}

function run(mode) {
  if (job || page !== 'practice') return;
  const code = editor.value;
  if (mode !== 'example' && !code.trim()) {
    renderResult({ status: 'error', message: '先在編輯器輸入程式，並將答案存到 result。' });
    editor.focus();
    return;
  }
  const libraries = selected.track === 'pandas' ? ['pandas'] :
    selected.track === 'python' ? [] : ['numpy', ...(selected.libraries || [])];
  job = { id: selected.id, libraries };
  const loading = !workerReady || libraries.some(library => !readyLibraries.has(library));
  toggleBusy(true);
  renderResult({ status: loading ? 'loading' : 'working' });
  if (loading) runtimeStatus('loading', '載入執行環境');
  try {
    if (!worker) {
      runtimeStatus('loading', '載入 Python');
      worker = new Worker(new URL('./runner.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.type === 'ready') {
          workerReady = true;
          job?.libraries.forEach(library => readyLibraries.add(library));
          runtimeStatus('ready', 'Python ' + data.version);
          if (!job) return;
          clearTimeout(timeout);
          timeout = setTimeout(() => fail('程式執行超過 12 秒。請檢查是否有無限迴圈，再試一次。', 'Python 待重啟'), 12000);
          renderResult({ status: 'working' });
        } else if (data.type === 'result') {
          finish(data.result);
        } else if (data.type === 'failure') {
          fail('請確認網路可以連到 cdn.jsdelivr.net，再按一次執行。' + (data.message ? '\n' + data.message : ''));
        }
      };
      worker.onerror = () => fail('無法開啟 Python 執行環境。請用 Start-Practice.cmd 啟動本機網站，再用瀏覽器開啟。');
    }
    timeout = setTimeout(() => fail(loading ? '下載執行環境逾時。請確認網路連線後重試。' : '程式執行逾時。'), loading ? 90000 : 12000);
    const inputs = Object.fromEntries(selected.inputs.map(key => [key, datasets[key]]));
    worker.postMessage({ type: 'evaluate', payload: { mode, code, libraries, datasets: inputs, exercise: { id: selected.id, solution: selected.solution } } });
  } catch {
    fail('請使用 Start-Practice.cmd 啟動本機網站，再用瀏覽器開啟。');
  }
}

function updateModuleOptions() {
  const track = $('filter-track').value;
  const list = modules.filter(([, , , owner]) => !track || owner === track);
  $('filter-module').replaceChildren(new Option('全部單元', ''),
    ...list.map(([key, title]) => new Option(title, key)));
}
for (const [key, title] of tracks) $('filter-track').add(new Option(title, key));
updateModuleOptions();
for (const id of ['search', 'filter-module', 'filter-status']) $(id).addEventListener('input', renderCatalog);
$('filter-track').addEventListener('change', () => {
  updateModuleOptions();
  renderCatalog();
});
renderGuide();
renderHome();
for (const [key, title] of [['', '全部'], ...tracks]) {
  const button = element('button', title);
  button.type = 'button';
  button.dataset.track = key;
  button.addEventListener('click', () => {
    if (conceptTrack === key) return;
    conceptTrack = key;
    renderConcepts();
  });
  $('concept-filters').append(button);
}
document.querySelectorAll('[data-jump]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.jump === 'concepts') conceptTrack = '';
    navigate(button.dataset.jump);
  });
});
$('home-brand').addEventListener('click', event => {
  event.preventDefault();
  if (page !== 'home') navigate('home');
});
$('home-start').addEventListener('click', () => {
  navigate('practice', (exercises.find(item => !isPassed(item.id)) || exercises[0]).id);
});
document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', () => {
    if (page !== button.dataset.page) navigate(button.dataset.page);
  });
});
$('first').addEventListener('click', () => navigate('practice', exercises[0].id));
$('source-shortcut').addEventListener('click', event => {
  event.preventDefault();
  navigate('guide');
  $('sources').scrollIntoView({ block: 'nearest' });
});
$('previous').addEventListener('click', () => navigate('practice', exercises[exercises.indexOf(selected) - 1].id));
$('next').addEventListener('click', () => navigate('practice', exercises[exercises.indexOf(selected) + 1].id));
$('reset').addEventListener('click', () => {
  if (editor.value === selected.starter || window.confirm('要用起始程式取代目前這題的草稿嗎？')) changeCode(selected.starter);
});
$('apply-solution').addEventListener('click', () => {
  if (editor.value === selected.starter || editor.value === selected.solution ||
    window.confirm('要用參考解法取代目前這題的草稿嗎？')) changeCode(selected.solution);
});
$('run').addEventListener('click', () => run('run'));
$('submit').addEventListener('click', () => run('submit'));
$('show-expected').addEventListener('click', () => run('example'));
$('stop').addEventListener('click', () => stopJob('你可以修改程式後再執行。'));
editor.addEventListener('input', () => {
  highlightCode();
  remember(selected.id, { code: editor.value });
  if (lastResults.delete(selected.id)) renderResult();
});
editor.addEventListener('scroll', scrollCode);
editor.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    run(event.shiftKey ? 'submit' : 'run');
  }
});
window.addEventListener('popstate', () => readLocation());
readLocation(true);
