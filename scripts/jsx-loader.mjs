export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    return nextLoad(url, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}
