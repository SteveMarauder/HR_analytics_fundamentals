import contextlib
import copy
import importlib
import io
import json
import math
import numbers
import traceback

pd = None
np = None


def prepare(libraries):
    global pd, np
    if "pandas" in libraries and pd is None:
        pd = importlib.import_module("pandas")
    if ("numpy" in libraries or pd is not None) and np is None:
        np = importlib.import_module("numpy")


class Output(io.StringIO):
    def write(self, value):
        remaining = max(0, 4000 - self.tell())
        super().write(value[:remaining])
        return len(value)


def context(datasets, alternate=False):
    scope = {"StringIO": io.StringIO}
    if pd is not None:
        scope["pd"] = pd
    if np is not None:
        scope["np"] = np
    for name, data in datasets.items():
        if "value" in data:
            scope[name] = copy.deepcopy(data["alternate" if alternate else "value"])
        elif "array" in data:
            values = data["alternate" if alternate else "array"]
            dtype = float if any(element is None for element in values) else None
            scope[name] = np.asarray(values, dtype=dtype)
        elif "text" in data:
            scope[name] = data["alternate" if alternate else "text"]
        else:
            scope[name] = pd.DataFrame(
                data["alternate" if alternate else "rows"], columns=data["names"]
            )
    return scope


def display(value):
    if pd is not None and isinstance(value, (pd.DataFrame, pd.Series)):
        return value.to_string(max_rows=16)
    if np is not None and isinstance(value, np.ndarray):
        return np.array2string(value, precision=7, threshold=36, edgeitems=6)
    return str(value)[:4000]


def compare(actual, expected, exercise_id):
    if pd is not None and isinstance(expected, pd.DataFrame):
        if not isinstance(actual, pd.DataFrame):
            raise AssertionError("result 必須是一張 DataFrame。")
        if exercise_id != 27:
            # Source row labels are incidental unless the task specifies an index.
            if exercise_id not in (21, 31, 35):
                actual = actual.reset_index(drop=True)
                expected = expected.reset_index(drop=True)
        pd.testing.assert_frame_equal(
            actual, expected, check_dtype=False, check_names=False,
            check_index_type=False, check_column_type=False, check_freq=False,
            check_exact=False, rtol=1e-7, atol=1e-9,
        )
    elif pd is not None and isinstance(expected, pd.Series):
        if not isinstance(actual, pd.Series):
            raise AssertionError("result 必須是一個 Series。")
        if exercise_id == 14 and str(actual.dtype) != "Int64":
            raise AssertionError('hours 的 dtype 應為 "Int64"。')
        pd.testing.assert_series_equal(
            actual, expected, check_dtype=False, check_names=False,
            check_index_type=False, check_freq=False, check_exact=False,
            rtol=1e-7, atol=1e-9,
        )
    elif np is not None and isinstance(expected, np.ndarray):
        if not isinstance(actual, np.ndarray):
            raise AssertionError("result 必須是 NumPy ndarray。")
        if actual.shape != expected.shape:
            raise AssertionError(f"陣列形狀為 {actual.shape}，預期是 {expected.shape}。")
        if exercise_id == 71 and actual.dtype != expected.dtype:
            raise AssertionError("請將陣列轉為 float64。")
        if expected.dtype.kind == "b" and actual.dtype.kind != "b":
            raise AssertionError("請回傳布林陣列。")
        if expected.dtype.kind in "iufc":
            if actual.dtype.kind not in "iufc":
                raise AssertionError("請回傳數值陣列。")
            np.testing.assert_allclose(actual, expected, rtol=1e-7, atol=1e-9, equal_nan=True)
        else:
            np.testing.assert_array_equal(actual, expected)
    elif isinstance(expected, dict):
        if not isinstance(actual, dict) or actual.keys() != expected.keys():
            raise AssertionError("請確認 result 的字典鍵與題目相符。")
        for key in expected:
            compare(actual[key], expected[key], exercise_id)
    elif isinstance(expected, (list, tuple)):
        if not isinstance(actual, type(expected)) or len(actual) != len(expected):
            raise AssertionError(f"result 必須是長度 {len(expected)} 的 {type(expected).__name__}。")
        for left, right in zip(actual, expected):
            compare(left, right, exercise_id)
    elif isinstance(expected, bool) or (np is not None and isinstance(expected, np.bool_)):
        if not (isinstance(actual, bool) or (np is not None and isinstance(actual, np.bool_))) or actual != expected:
            raise AssertionError("result 必須是符合題意的布林值。")
    elif isinstance(expected, numbers.Integral):
        if isinstance(actual, bool) or not isinstance(actual, numbers.Integral) or actual != expected:
            raise AssertionError("result 必須是符合題意的整數。")
    elif isinstance(expected, numbers.Real):
        if isinstance(actual, bool) or not isinstance(actual, numbers.Real) or not math.isclose(actual, expected, rel_tol=1e-7, abs_tol=1e-9):
            raise AssertionError("result 的數值與預期不同。")
    elif isinstance(expected, str):
        if not isinstance(actual, str) or actual != expected:
            raise AssertionError("result 的文字與預期不同。")
    elif type(actual) is not type(expected) or actual != expected:
        raise AssertionError("result 的型別或內容與預期不同。")


def execute(code, datasets, alternate=False):
    scope = context(datasets, alternate)
    output = Output()
    with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
        exec(compile(code, "你的程式.py", "exec"), scope)
    if "result" not in scope:
        raise NameError("請把最後的答案存到 result，再執行一次。")
    return scope["result"], output.getvalue()


def explain(error):
    tips = {
        "NameError": '檢查變數拼字。若程式還有 ___，先把它替換成你要填的內容。',
        "KeyError": '檢查欄名大小寫與引號，可先在「題目」看輸入資料。',
        "SyntaxError": '檢查括號、引號和冒號是否成對。',
        "TypeError": '檢查參數的型別，確認這裡要的是欄名、清單、數字還是條件。',
        "AttributeError": '檢查方法拼字，也確認目前操作的是 DataFrame、Series 還是文字。',
        "ValueError": '檢查參數和資料內容。篩選多個條件時，每個條件都要加括號。',
    }
    kind = type(error).__name__
    frames = traceback.extract_tb(error.__traceback__)
    source_frames = [frame for frame in frames if frame.filename == "你的程式.py"]
    line = getattr(error, "lineno", None) or (source_frames[-1].lineno if source_frames else None)
    location = f"第 {line} 行 · " if line is not None else ""
    return f"{location}{kind}: {error}\n{tips.get(kind, '')}".rstrip()[:4000]


def evaluate(payload):
    prepare(payload.get("libraries", ["pandas"]))
    item = payload["exercise"]
    datasets = payload["datasets"]
    expected, _ = execute(item["solution"], datasets)
    if payload["mode"] == "example":
        return {"status": "example", "expected": display(expected)}
    try:
        actual, stdout = execute(payload["code"], datasets)
    except (Exception, SystemExit) as error:
        return {"status": "error", "message": explain(error), "expected": display(expected)}
    result = {"actual": display(actual), "expected": display(expected), "stdout": stdout}
    if payload["mode"] == "run":
        return {**result, "status": "ran"}
    try:
        compare(actual, expected, item["id"])
    except AssertionError as error:
        return {**result, "status": "mismatch", "message": str(error)[:1800]}
    try:
        hidden, _ = execute(payload["code"], datasets, alternate=True)
        target, _ = execute(item["solution"], datasets, alternate=True)
        compare(hidden, target, item["id"])
    except (Exception, SystemExit):
        return {**result, "status": "alternate"}
    return {**result, "status": "passed"}


def evaluate_json(payload):
    return json.dumps(evaluate(json.loads(payload)), ensure_ascii=False)
