# 人資資料練習室

這是一個繁體中文的 People Analytics 程式練習站。使用合成的人事、招募、培訓與問卷資料，循序練習資料處理、統計和數值運算。

## 開始練習

- [開啟 GitHub Pages 練習站](https://stevemarauder.github.io/HR_analytics_fundamentals/)
- Windows 本機使用時，按兩下 **Start-Practice.cmd**，或在專案目錄執行 **python launch.py**。啟動器使用 Python 3 標準函式庫。
- 第一次使用可先開「新手指南」。每題都有範例資料、起始程式、小示範、提示、參考解法和閱讀來源。

## 課程內容

| 主題 | 題數 | 練習範圍 |
| --- | ---: | --- |
| Python 基礎 | 28 | 變數、運算、字串、清單、字典、集合、條件、迴圈、函式、CSV、JSON、日期與例外 |
| NumPy | 26 | 陣列、dtype、shape、索引、遮罩、缺值、複本、axis、broadcasting、加權與可重現模擬 |
| pandas | 48 | CSV、篩選、清理、日期、分組、合併、重塑、索引、FTE、招募漏斗、留任與離職率 |
| 統計學 | 32 | 描述統計、抽樣、機率、區間估計、bootstrap、t 檢定、卡方、效果量、相關與迴歸 |
| 線性代數 | 26 | 向量、內積、範數、矩陣乘法、線性方程組、秩、投影、最小平方法、QR、SVD、PCA |

先用題目微型資料手算一筆，把結果存到 **result**。按「執行」只看範例輸出，按「提交答案」用範例和另一組資料比對。題目指定的型別、形狀、欄名和順序也可能納入判分。比率題會明示分子、分母和零值或缺值的規則。

網站是靜態網站。Python 透過 Pyodide 在瀏覽器 Web Worker 執行，依題目載入 NumPy、pandas 或 SciPy。首次載入執行環境及新套件需要可存取 jsDelivr。程式、模擬資料、草稿和進度在瀏覽器內處理，草稿與通過紀錄依網站來源儲存。測資與參考解法可在公開原始碼查閱。

## 教材來源

- [Python 官方教學](https://docs.python.org/3/tutorial/)
- [NumPy 初學者指南](https://numpy.org/doc/stable/user/absolute_beginners.html)
- [pandas 官方使用指南](https://pandas.pydata.org/docs/user_guide/)
- [OpenStax Introductory Statistics 2e](https://openstax.org/books/introductory-statistics-2e/pages/1-introduction) 與 [NIST/SEMATECH 統計方法手冊](https://www.itl.nist.gov/div898/handbook/eda/eda.htm)
- [SciPy 統計函式文件](https://docs.scipy.org/doc/scipy/reference/stats.html)
- [MIT OpenCourseWare 18.06 Linear Algebra](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)
- [CIPD People Analytics Factsheet](https://www.cipd.org/en/knowledge/factsheets/analytics-factsheet/)

網站執行環境固定使用 [Pyodide 314.0.8](https://pyodide.org/en/314.0.8/usage/packages-in-pyodide.html)。pandas 教材依 3.1.1 官方文件編寫，瀏覽器套件是 pandas 3.0.2，練習使用兩版共通介面。
