const runtimeUrl = 'https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';
let runtime;

async function loadRuntime() {
  const { loadPyodide } = await import(runtimeUrl + 'pyodide.mjs');
  const python = await loadPyodide({ indexURL: runtimeUrl });
  const judge = await fetch(new URL('./judge.py', import.meta.url));
  if (!judge.ok) throw new Error('無法讀取判分程式。');
  python.runPython(await judge.text());
  return python;
}

self.onmessage = async ({ data }) => {
  try {
    if (!runtime) runtime = loadRuntime();
    const python = await runtime;
    if (data.payload.libraries.length) await python.loadPackage(data.payload.libraries);
    self.postMessage({ type: 'ready', version: python.runPython('import sys\nsys.version.split()[0]') });
    python.globals.set('_request_json', JSON.stringify(data.payload));
    try {
      const result = JSON.parse(python.runPython('evaluate_json(_request_json)'));
      self.postMessage({ type: 'result', result });
    } finally {
      python.globals.delete('_request_json');
    }
  } catch (error) {
    self.postMessage({ type: 'failure', message: String(error) });
  }
};
