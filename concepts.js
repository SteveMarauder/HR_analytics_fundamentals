const node = (tag, text, className) => {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
};

function choices(label, options, update) {
  const box = node('div', undefined, 'concept-choices');
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', label);
  const buttons = options.map(([key, title], index) => {
    const button = node('button', title);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      update(key);
    });
    box.append(button);
    return button;
  });
  update(options[0][0]);
  return box;
}

function slider(label, min, max, start, unit, update) {
  const control = node('label', undefined, 'concept-slider');
  const title = node('strong', label);
  const value = node('output');
  const range = node('input');
  range.type = 'range';
  range.min = min;
  range.max = max;
  range.value = start;
  control.append(title, value, range);
  const change = () => {
    value.textContent = range.value + unit;
    update(Number(range.value));
  };
  range.addEventListener('input', change);
  change();
  return control;
}

function matrix(values, label, highlight = () => false) {
  const wrap = node('div', undefined, 'matrix-block');
  const grid = node('div', undefined, 'concept-matrix');
  grid.style.setProperty('--columns', values[0].length);
  for (const [r, row] of values.entries()) {
    for (const [c, value] of row.entries()) grid.append(node('span', String(value), highlight(r, c) ? 'active-cell' : ''));
  }
  wrap.append(node('p', label), grid);
  return wrap;
}

function table(rows, label, mark = () => false) {
  const wrap = node('div', undefined, 'concept-table');
  const grid = node('table');
  grid.setAttribute('aria-label', label);
  const header = grid.createTHead().insertRow();
  for (const title of rows[0]) {
    const th = node('th', title);
    th.scope = 'col';
    header.append(th);
  }
  const body = grid.createTBody();
  rows.slice(1).forEach((row, index) => {
    const tr = body.insertRow();
    if (mark(index)) tr.className = 'linked-row';
    row.forEach(value => tr.append(node('td', String(value))));
  });
  wrap.append(node('p', label), grid);
  return wrap;
}

function outputLine() {
  const note = node('p', '', 'concept-output');
  note.setAttribute('aria-live', 'polite');
  return note;
}

function plot(draw, label) {
  const canvas = node('canvas', undefined, 'concept-canvas');
  canvas.width = 640;
  canvas.height = 338;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  const ctx = canvas.getContext('2d');
  return {
    canvas,
    redraw(state) {
      if (!ctx) return;
      ctx.clearRect(0, 0, 640, 338);
      return draw(ctx, state);
    },
  };
}

function line(ctx, x1, y1, x2, y2, stroke, width = 1, dash = []) {
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function dot(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function label(ctx, text, x, y, align = 'left', color = '#b1c2df') {
  ctx.font = '18px system-ui, sans-serif';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(String(text), x, y);
}

const gridColor = '#263751';
const cyan = '#67f1dc';
const violet = '#acacff';
const gold = '#ffc68f';

function axes(ctx, [xmin, xmax], [ymin, ymax], xTicks, yTicks) {
  const x = value => 65 + (value - xmin) * 532 / (xmax - xmin);
  const y = value => 278 - (value - ymin) * 247 / (ymax - ymin);
  for (const tick of xTicks) {
    line(ctx, x(tick), y(ymin), x(tick), y(ymax), gridColor);
    label(ctx, tick, x(tick), 305, 'center');
  }
  for (const tick of yTicks) {
    line(ctx, x(xmin), y(tick), x(xmax), y(tick), gridColor);
    label(ctx, tick, 50, y(tick) + 6, 'right');
  }
  return [x, y];
}

const scores = [[1, 49], [2, 62], [3, 55], [4, 71], [5, 65], [6, 73], [7, 69], [8, 83], [9, 78], [10, 91]];

function drawScatter(ctx, lastScore, interactive = true) {
  const values = scores.map((point, i) => i === scores.length - 1 ? [point[0], lastScore] : point);
  const [x, y] = axes(ctx, [0, 11], [35, 100], [0, 2, 4, 6, 8, 10], [40, 55, 70, 85, 100]);
  const mx = values.reduce((sum, [h]) => sum + h, 0) / values.length;
  const my = values.reduce((sum, [, score]) => sum + score, 0) / values.length;
  const slope = values.reduce((sum, [h, score]) => sum + (h - mx) * (score - my), 0) /
    values.reduce((sum, [h]) => sum + (h - mx) ** 2, 0);
  const predict = h => my + slope * (h - mx);
  line(ctx, x(1), y(predict(1)), x(10), y(predict(10)), violet, 3, [8, 5]);
  values.forEach(([h, score], i) => {
    const highlighted = interactive && i === values.length - 1;
    dot(ctx, x(h), y(score), highlighted ? 7 : 5.5, highlighted ? gold : cyan);
  });
  label(ctx, '測驗分數', 66, 22);
  label(ctx, '訓練時數（小時）', 597, 329, 'right');
  return slope;
}

export function mountHeroPlot(host) {
  const chart = plot((ctx, score) => drawScatter(ctx, score, false), '模擬訓練時數與技能測驗分數散點圖。每個點代表一位員工，虛線為最小平方法迴歸線。');
  chart.redraw(91);
  host.replaceChildren(chart.canvas);
}

function loopDemo() {
  const frame = node('div', undefined, 'concept-frame token-flow');
  const note = outputLine();
  const rows = [['E01', true], ['E02', false], ['E03', true], ['E04', true]];
  const control = slider('已讀紀錄', 0, rows.length, 2, ' 筆', step => {
    frame.replaceChildren(...rows.map(([id, active], index) => {
      const token = node('div', undefined, 'flow-token ' + (index < step ? (active ? 'accepted' : 'skipped') : 'pending'));
      token.append(node('strong', id), node('span', index < step ? (active ? '在職 · 加 1' : '離職 · 跳過') : '尚未讀取'));
      return token;
    }));
    note.textContent = 'count = ' + rows.slice(0, step).filter(([, active]) => active).length;
  });
  return [control, frame, note];
}

const hours = [[4, 8, 3], [6, 12, 9]];

function axisDemo() {
  const frame = node('div', undefined, 'concept-frame matrix-flow');
  const note = outputLine();
  const control = choices('加總方向', [['0', 'axis=0｜按月'], ['1', 'axis=1｜按部門']], axis => {
    const byColumns = axis === '0';
    const sums = byColumns ? [hours[0].map((h, col) => h + hours[1][col])] :
      hours.map(row => [row.reduce((sum, h) => sum + h, 0)]);
    frame.replaceChildren(matrix(hours, '原表 · 部門 × 月份', (r, c) => byColumns ? c === 0 : r === 0),
      node('span', '→', 'matrix-operator'), matrix(sums, '加總結果', (r, c) => byColumns ? c === 0 : r === 0));
    note.textContent = byColumns ? '沿部門方向相加，第一個月是 4 + 6 = 10。' : '沿月份方向相加，第一個部門是 4 + 8 + 3 = 15。';
  });
  return [control, frame, note];
}

function broadcastDemo() {
  const frame = node('div', undefined, 'concept-frame matrix-flow');
  const note = outputLine();
  const control = choices('扣減方向', [['month','每月扣減 (3,)'], ['team','每部門扣減 (2, 1)']], mode => {
    const adjustment = mode === 'month' ? [[0, 1, 2]] : [[2], [4]];
    const diff = hours.map((row, r) => row.map((h, c) => h - (mode === 'month' ? adjustment[0][c] : adjustment[r][0])));
    frame.replaceChildren(matrix(hours, '原表 (2, 3)'), node('span', '−', 'matrix-operator'),
      matrix(adjustment, '調整值', () => true), node('span', '=', 'matrix-operator'), matrix(diff, '結果 (2, 3)'));
    note.textContent = mode === 'month' ? '同一組月份調整值重用於每列。' : '每部門用自己的調整值，套用到該部門所有月份。';
  });
  return [control, frame, note];
}

function joinDemo() {
  const frame = node('div', undefined, 'concept-frame table-flow');
  const note = outputLine();
  const control = choices('合併類型', [['left','left｜保留名冊'], ['inner','inner｜只留配對']], mode => {
    const roster = [['id','部門'],['E01','人資'],['E02','技術'],['E03','業務']];
    const teams = [['部門','事業群'],['人資','營運'],['技術','產品']];
    const rows = [['id','部門','事業群'],['E01','人資','營運'],['E02','技術','產品']];
    if (mode === 'left') rows.push(['E03','業務','缺值']);
    frame.replaceChildren(table(roster, '員工名冊', i => i === 2), table(teams, '部門對照表'), table(rows, '依部門合併後', i => i === 2));
    note.textContent = mode === 'left' ? '左表的 3 位員工都保留。業務部沒配到，事業群是缺值。' : '只留下配得到的 2 位。確認員工人數是否因此減少。';
  });
  return [control, frame, note];
}

function groupDemo() {
  const frame = node('div', undefined, 'concept-frame group-flow');
  const note = outputLine();
  const teams = [['人資',[5, null, 7]], ['技術',[4,9]]];
  const control = choices('彙總方式', [['size','size｜數紀錄'], ['count','count｜數已填'], ['mean','mean｜算平均']], mode => {
    frame.replaceChildren(...teams.map(([team, values]) => {
      const valid = values.filter(v => v !== null);
      const group = node('div', undefined, 'group-item');
      const chips = node('div', undefined, 'group-chips');
      values.forEach(h => chips.append(node('span', h === null ? '缺值' : h + ' h', h === null && mode !== 'size' ? 'dimmed' : '')));
      const summary = mode === 'size' ? values.length : mode === 'count' ? valid.length : valid.reduce((sum, h) => sum + h, 0) / valid.length;
      group.append(node('strong', team), chips, node('b', String(summary)));
      return group;
    }));
    note.textContent = mode === 'size' ? '人資組有三筆員工紀錄，包括時數缺值的那筆。' :
      mode === 'count' ? '人資組只有兩筆時數已填。' : '人資組用已填的 5 和 7 小時算平均，得到 6 小時。';
  });
  return [control, frame, note];
}

function intervalDemo() {
  const mean = 40;
  const sd = 12;
  const note = outputLine();
  const graph = plot((ctx, n) => {
    const margin = 1.96 * sd / Math.sqrt(n);
    const x = h => 64 + (h - 30) * 532 / 20;
    line(ctx, x(30), 257, x(50), 257, gridColor, 2);
    for (const tick of [30, 35, 40, 45, 50]) {
      line(ctx, x(tick), 86, x(tick), 257, gridColor);
      label(ctx, tick, x(tick), 286, 'center');
    }
    const left = x(mean - margin);
    const right = x(mean + margin);
    line(ctx, left, 158, right, 158, cyan, 5);
    line(ctx, left, 140, left, 176, cyan, 3);
    line(ctx, right, 140, right, 176, cyan, 3);
    dot(ctx, x(mean), 158, 9, violet);
    label(ctx, '95% 信賴區間', x(mean), 77, 'center', '#e8eeff');
    label(ctx, (mean - margin).toFixed(1), left - 8, 208, 'right');
    label(ctx, (mean + margin).toFixed(1), right + 8, 208);
    label(ctx, '平均工時', 595, 323, 'right');
  }, '平均工時的 95% 信賴區間。樣本數增加時，區間縮短。');
  const control = slider('樣本數', 9, 120, 25, ' 人', n => {
    graph.redraw(n);
    const margin = 1.96 * sd / Math.sqrt(n);
    note.textContent = '樣本平均固定為 40 小時。區間為 ' + (mean - margin).toFixed(1) + '–' + (mean + margin).toFixed(1) + ' 小時。';
  });
  return [control, graph.canvas, note];
}

function regressionDemo() {
  const note = outputLine();
  const graph = plot(drawScatter, '散點與最小平方法迴歸線。調整右側橙色資料點可以看到斜率改變。');
  const control = slider('橙色員工的測驗分數', 40, 98, 91, ' 分', score => {
    const slope = graph.redraw(score);
    if (slope !== undefined) note.textContent = '擬合斜率為 ' + slope.toFixed(2) + ' 分／小時。右端的點變動會拉動迴歸線。';
  });
  return [control, graph.canvas, note];
}

function matmulDemo() {
  const frame = node('div', undefined, 'concept-frame matrix-flow');
  const note = outputLine();
  const skills = [[3, 4, 1], [2, 1, 4]];
  const weights = [[0.5, 0.25], [0.3, 0.25], [0.2, 0.5]];
  const show = (r, c) => {
    const scores = skills.map(row => [0, 1].map(col => row.reduce((sum, score, k) => sum + score * weights[k][col], 0).toFixed(2)));
    frame.replaceChildren(matrix(skills, '技能分數 (2, 3)', row => row === r), node('span', '×', 'matrix-operator'),
      matrix(weights, '組合權重 (3, 2)', (_, col) => col === c), node('span', '=', 'matrix-operator'),
      matrix(scores, '加權分數 (2, 2)', (row, col) => row === r && col === c));
    note.textContent = skills[r].map((skill, k) => skill + ' × ' + weights[k][c]).join(' + ') + ' = ' + scores[r][c];
  };
  const control = choices('要查看的輸出格', [['0,0','員工 A × 組合 1'], ['0,1','員工 A × 組合 2'], ['1,0','員工 B × 組合 1'], ['1,1','員工 B × 組合 2']], point => {
    const [r, c] = point.split(',').map(Number);
    show(r, c);
  });
  return [control, frame, note];
}

function projectionDemo() {
  const note = outputLine();
  const baseY = 3;
  const coords = angle => {
    const a = angle * Math.PI / 180;
    return [Math.cos(a), Math.sin(a)];
  };
  const graph = plot((ctx, angle) => {
    const [x, y] = axes(ctx, [-4, -4 + 6 * 532 / 247], [-1, 5], [-2, 0, 2, 4, 6, 8], [0, 1, 2, 3, 4, 5]);
    const [ux, uy] = coords(angle);
    const length = 4 * ux + baseY * uy;
    const px = length * ux;
    const py = length * uy;
    line(ctx, x(0), y(0), x(5.1 * ux), y(5.1 * uy), violet, 3);
    line(ctx, x(0), y(0), x(4), y(baseY), cyan, 3);
    line(ctx, x(px), y(py), x(4), y(baseY), gold, 3, [7, 5]);
    dot(ctx, x(4), y(baseY), 7, cyan);
    dot(ctx, x(px), y(py), 7, violet);
    label(ctx, '觀測', x(4) + 12, y(baseY) - 8, 'left', cyan);
    label(ctx, '投影', x(px) - 12, y(py) - 10, 'right', violet);
  }, '向量正交投影。青色為觀測向量，紫色為基準方向，橙色虛線為殘差。');
  const control = slider('基準方向', 0, 75, 20, '°', angle => {
    graph.redraw(angle);
    const [ux, uy] = coords(angle);
    const length = 4 * ux + baseY * uy;
    const residual = Math.hypot(4 - length * ux, baseY - length * uy);
    note.textContent = '投影長度 ' + length.toFixed(2) + '，垂直殘差長度 ' + residual.toFixed(2) + '。';
  });
  return [control, graph.canvas, note];
}

function pcaDemo() {
  const samples = [[-3,-2],[-2,-1.4],[-1,-1],[0,0.8],[1,0],[2,1.1],[3,2.5]];
  const centered = samples.map(([a, b]) => [a, b - samples.reduce((sum, [, y]) => sum + y, 0) / samples.length]);
  const note = outputLine();
  const graph = plot((ctx, angle) => {
    const halfWidth = 3 * 532 / 247;
    const [x, y] = axes(ctx, [-halfWidth, halfWidth], [-3, 3], [-6,-4,-2,0,2,4,6], [-3,-2,-1,0,1,2,3]);
    const [ux, uy] = [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
    const reach = Math.min(3.8 / Math.abs(ux || 0.0001), 2.85 / Math.abs(uy || 0.0001));
    line(ctx, x(-reach * ux), y(-reach * uy), x(reach * ux), y(reach * uy), violet, 3);
    centered.forEach(([a, b]) => {
      const along = a * ux + b * uy;
      const px = along * ux;
      const py = along * uy;
      line(ctx, x(a), y(b), x(px), y(py), '#607294', 2, [5, 5]);
      dot(ctx, x(a), y(b), 5.5, cyan);
      dot(ctx, x(px), y(py), 5.5, violet);
    });
    label(ctx, '中心化問卷分數', 596, 325, 'right');
  }, '將中心化的兩欄問卷資料投影到旋轉中的方向，比較各方向上的變異。');
  const control = slider('投影方向', 0, 175, 30, '°', angle => {
    graph.redraw(angle);
    const a = angle * Math.PI / 180;
    const projected = centered.reduce((sum, [x, y]) => sum + (x * Math.cos(a) + y * Math.sin(a)) ** 2, 0);
    const total = centered.reduce((sum, [x, y]) => sum + x ** 2 + y ** 2, 0);
    note.textContent = '這個方向保留 ' + (100 * projected / total).toFixed(1) + '% 的原始變異。試著找出比例最高的方向。';
  });
  return [control, graph.canvas, note];
}

export const concepts = [
  ['loop', 'python', '迴圈與計數器', '逐筆讀取名冊，符合條件時才把計數器加 1。', 56, loopDemo],
  ['axis', 'numpy', '陣列的 axis', '同一張部門月表，沿不同軸加總會留下不同標籤。', 82, axisDemo],
  ['broadcast', 'numpy', 'Broadcasting', '運算時，較小陣列按相容的形狀重用數值。', 84, broadcastDemo],
  ['join', 'pandas', '左合併與內合併', '先看員工名冊和部門表的鍵，再比較哪些人留在結果。', 28, joinDemo],
  ['group', 'pandas', '先分組，再彙總', '數員工、數有時數的紀錄、算平均，是三種不同的彙總。', 19, groupDemo],
  ['interval', 'stats', '樣本數與信賴區間', '假設母體標準差固定為 12 小時，以已知標準差的 z 區間觀察樣本數的效果。', 111, intervalDemo],
  ['regression', 'stats', '散點與迴歸線', '移動一個高時數的資料點，看看擬合斜率如何變化。觀察關聯需要考量其他因素。', 123, regressionDemo],
  ['matmul', 'linear', '矩陣相乘', '輸出的一格等於左矩陣的一列與右矩陣的一欄做內積。', 136, matmulDemo],
  ['projection', 'linear', '向量投影與殘差', '紫色是基準方向，青色是觀測，虛線是垂直於基準的殘差。', 141, projectionDemo],
  ['pca', 'linear', 'PCA 與變異保留', '第一主成分找的是投影後變異最大的方向。試著旋轉這條線。', 151, pcaDemo],
];

export function createConcept(id, options = {}) {
  const [, , title, description, exercise, build] = concepts.find(([key]) => key === id);
  const card = node(options.inline ? 'details' : 'section', undefined, 'concept-card' + (options.inline ? ' concept-inline' : ' card'));
  const heading = node(options.inline ? 'summary' : 'h2', options.inline ? '用圖像理解 · ' + title : title);
  const body = node('div', undefined, 'concept-body');
  card.append(heading, body);
  const mount = () => {
    body.append(node('p', description, 'concept-description'), ...build());
    if (options.practice) {
      const button = node('button', '練習這個概念', 'button secondary compact');
      button.type = 'button';
      button.addEventListener('click', () => options.practice(exercise));
      body.append(button);
    }
  };
  if (options.inline) card.addEventListener('toggle', () => {
    if (card.open && !body.childElementCount) mount();
  });
  else mount();
  return card;
}
