import { pandasDocs, pandasModules, pandasDatasets, pandasExercises } from './catalog.js';
import { pythonExercises, pythonDatasets } from './python-course.js';
import { numpyExercises, numpyDatasets } from './numpy-course.js';
import { statsExercises, statsDatasets } from './stats-course.js';
import { linearExercises, linearDatasets } from './linear-course.js';
import { fieldExercises, fieldDatasets } from './field-course.js';

export const tracks = [
  ['python', 'Python 基礎', '從變數和條件開始，寫出可重跑的人資資料處理程式。', '在職人數、工時匯入、名單驗證'],
  ['numpy', 'NumPy', '用陣列、遮罩和向量化一次處理整批數字。', '訓練時數、出勤、FTE 與情境試算'],
  ['pandas', 'pandas', '整理、合併並彙總 HR 表格，核對每個指標的分子分母。', '人員名冊、招募漏斗、離職率與人力報表'],
  ['stats', '統計學', '描述員工資料、量化不確定性，並練習解讀比較結果。', '問卷、試行方案、招募轉換與工時估計'],
  ['linear', '線性代數', '以向量與矩陣表示人力問題，理解迴歸和 PCA 背後的運算。', '技能盤點、工時配置、人力預測'],
];

export const sources = {
  pyIntro: ['Python 官方教學 · 資料型別與運算', 'https://docs.python.org/3/tutorial/introduction.html'],
  pyFlow: ['Python 官方教學 · 控制流程與函式', 'https://docs.python.org/3/tutorial/controlflow.html'],
  pyData: ['Python 官方教學 · 資料結構', 'https://docs.python.org/3/tutorial/datastructures.html'],
  pyErr: ['Python 官方教學 · 例外處理', 'https://docs.python.org/3/tutorial/errors.html'],
  pyIO: ['Python 標準函式庫 · csv', 'https://docs.python.org/3/library/csv.html'],
  pyDate: ['Python 標準函式庫 · datetime', 'https://docs.python.org/3/library/datetime.html'],
  pyJson: ['Python 標準函式庫 · json', 'https://docs.python.org/3/library/json.html'],
  npIntro: ['NumPy 官方 · 初學者指南', 'https://numpy.org/doc/stable/user/absolute_beginners.html'],
  npIndex: ['NumPy 官方 · 陣列索引', 'https://numpy.org/doc/stable/user/basics.indexing.html'],
  npBroadcast: ['NumPy 官方 · Broadcasting', 'https://numpy.org/doc/stable/user/basics.broadcasting.html'],
  npCopies: ['NumPy 官方 · 複本與檢視', 'https://numpy.org/doc/stable/user/basics.copies.html'],
  npMath: ['NumPy 官方 · 數學運算', 'https://numpy.org/doc/stable/reference/routines.math.html'],
  npStats: ['NumPy 官方 · 統計運算', 'https://numpy.org/doc/stable/reference/routines.statistics.html'],
  npRandom: ['NumPy 官方 · 隨機抽樣', 'https://numpy.org/doc/stable/reference/random/index.html'],
  stSample: ['OpenStax · 抽樣與資料', 'https://openstax.org/books/introductory-statistics-2e/pages/1-introduction'],
  stDesc: ['OpenStax · 描述統計', 'https://openstax.org/books/introductory-statistics-2e/pages/2-introduction'],
  stProb: ['OpenStax · 機率', 'https://openstax.org/books/introductory-statistics-2e/pages/3-introduction'],
  stDist: ['OpenStax · 離散機率分布', 'https://openstax.org/books/introductory-statistics-2e/pages/4-introduction'],
  stCLT: ['OpenStax · 中央極限定理', 'https://openstax.org/books/introductory-statistics-2e/pages/7-introduction'],
  stCI: ['OpenStax · 信賴區間', 'https://openstax.org/books/introductory-statistics-2e/pages/8-introduction'],
  stTest: ['OpenStax · 兩樣本假設檢定', 'https://openstax.org/books/introductory-statistics-2e/pages/10-introduction'],
  stChi: ['OpenStax · 卡方分布', 'https://openstax.org/books/introductory-statistics-2e/pages/11-introduction'],
  stReg: ['OpenStax · 線性迴歸與相關', 'https://openstax.org/books/introductory-statistics-2e/pages/12-introduction'],
  stNist: ['NIST/SEMATECH 統計方法手冊 · 探索性資料分析', 'https://www.itl.nist.gov/div898/handbook/eda/eda.htm'],
  scipy: ['SciPy 官方 · 統計函式', 'https://docs.scipy.org/doc/scipy/reference/stats.html'],
  mit: ['MIT OpenCourseWare 18.06 · Linear Algebra', 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/'],
  npLA: ['NumPy 官方 · Linear algebra', 'https://numpy.org/doc/stable/reference/routines.linalg.html'],
  cipd: ['CIPD · People Analytics Factsheet', 'https://www.cipd.org/en/knowledge/factsheets/analytics-factsheet/'],
  ...Object.fromEntries(Object.entries(pandasDocs).map(([key, slug]) =>
    [key, ['pandas 官方使用指南', 'https://pandas.pydata.org/docs/user_guide/' + slug + '.html']])),
};

export const modules = [
  ['py_values', '值與文字', '先用變數、數字和字串完成一個小任務。', 'python'],
  ['py_collections', '資料結構', '用 list、dict、set 和 tuple 表示名冊與紀錄。', 'python'],
  ['py_control', '條件、迴圈與函式', '把「逐筆判斷」寫成可重用的規則。', 'python'],
  ['py_files', '檔案與錯誤', '匯入 CSV、解析日期並處理不合規資料。', 'python'],
  ['np_array', '陣列與形狀', '用 shape、dtype 與 axis 讀懂資料。', 'numpy'],
  ['np_index', '索引與布林遮罩', '取列、取欄、找達標與處理缺值。', 'numpy'],
  ['np_calc', '向量化與彙總', '用 broadcasting、加權與分位數算指標。', 'numpy'],
  ['np_sim', '抽樣與情境試算', '用固定 seed 建立可重現的模擬。', 'numpy'],
  ...pandasModules.map(row => [...row, 'pandas']),
  ['pd_field', '從資料到指標', '核對口徑、主鍵與輸出，再交付一張 HR 報表。', 'pandas'],
  ['st_describe', '量尺與描述統計', '用中心、離散與分布一起描述一組資料。', 'stats'],
  ['st_sampling', '機率、抽樣與估計', '把抽樣誤差和資料偏差分開辨認。', 'stats'],
  ['st_infer', '區間與假設檢定', '用信賴區間、效果量和檢定比較群組。', 'stats'],
  ['st_model', '相關、迴歸與解讀', '算出關聯，辨認它能支撐什麼結論。', 'stats'],
  ['la_vectors', '向量與內積', '用向量表示技能、工時和加權分數。', 'linear'],
  ['la_matrices', '矩陣與方程組', '理解矩陣乘法、秩和人力配置。', 'linear'],
  ['la_projection', '投影與最小平方法', '從幾何直覺走到迴歸與預測誤差。', 'linear'],
  ['la_decompose', '特徵值、SVD 與 PCA', '用分解找出模擬問卷的主要變異方向。', 'linear'],
];

const moduleTrack = Object.fromEntries(modules.map(([id,,,track]) => [id, track]));
export const datasets = { ...pandasDatasets, ...pythonDatasets, ...numpyDatasets, ...statsDatasets, ...linearDatasets, ...fieldDatasets };
export const exercises = [...pythonExercises, ...numpyExercises, ...pandasExercises, ...fieldExercises, ...statsExercises, ...linearExercises]
  .map((item, index) => ({ ...item, track: moduleTrack[item.module], number: index + 1 }));

export const learning = {
  python: [
    ['先理解資料長什麼樣', '用變數替數值命名。Python 字串用引號，list 用中括號，dict 用鍵對應值。位置從 0 開始。', 'pyIntro'],
    ['把規則寫成程式', '先手算一筆，再把同一規則放進 if、迴圈或函式。函式用 return 交回結果，print 用來查看中間值。', 'pyFlow'],
    ['練習輸入與邊界', '測一筆正常資料、一筆缺值、一筆格式錯誤。像 001 的員工編號用字串保留前導零。', 'pyIO'],
  ],
  numpy: [
    ['先看 shape 和 dtype', '例如 (3, 4) 可以代表 3 部門、4 個月。把每個軸代表什麼寫在紙上，再選 axis。', 'npIntro'],
    ['從一列推到全部', '算出一列的正確答案，再寫遮罩或向量化公式。要把每列平均拿去扣減時，用 keepdims 保留可廣播的形狀。', 'npBroadcast'],
    ['讓抽樣可以重跑', '使用 default_rng(seed)。對照時固定 seed，報告時說明抽樣方法和假設。', 'npRandom'],
  ],
  pandas: [
    ['先確認每列代表什麼', '名冊每人一列、異動表每事件一列、人力快照每部門每月一列。合併前說出每張表的主鍵。', 'start'],
    ['先檢查再計算', '按題目口徑選擇 size、count 或 nunique。合併用 validate 檢查關係，用 indicator 追蹤沒配對的列。', 'merge'],
    ['把數字和定義一起交付', '報告離職率時，附上分子、分母、月份與缺失原因的處理方式。小部門的比率可能因一人離開而明顯波動。', 'cipd'],
  ],
  stats: [
    ['先做描述和抽樣檢查', '比較分布之前先確認單位、樣本數、缺值和回覆率。平均值對極端值敏感，可並列中位數與四分位距。', 'stDesc'],
    ['估計與比較', '把效果量、區間和樣本數一起看。配對設計用同一人的前後差。兩個獨立群組的平均比較可使用 Welch t 檢定。', 'stTest'],
    ['把結果說回 HR 問題', 'p 值描述在虛無模型下得到至少同樣極端結果的機率。問卷或觀察資料的相關可能來自其他因素。', 'stReg'],
  ],
  linear: [
    ['讓每個軸都有業務意義', '矩陣的列可代表員工或部門，欄代表技能或月份。相乘前先確認內側維度和順序一致。', 'mit'],
    ['把迴歸當成投影', '最小平方法找出設計矩陣欄空間內最接近觀測值的向量。殘差與各欄近似垂直。', 'npLA'],
    ['用分解理解資料', '先中心化，再看 SVD 的奇異值與方向。PCA 的正負方向可同時翻轉，解讀時聚焦變異和欄位意義。', 'mit'],
  ],
};
