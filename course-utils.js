export const value = (sample, alternate) => ({ value: sample, alternate });
export const array = (sample, alternate) => ({ array: sample, alternate });

export function problem(id, module, title, api, source, inputs, story, spec, example, hint, starter, solution, note = '') {
  return { id, module, title, api, source, inputs: inputs.split(' ').filter(Boolean), story, spec, example, hint, starter, solution, note };
}
