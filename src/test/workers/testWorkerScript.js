export const testWorkerScript = `
self.onmessage = function(e) {
  const { action, data, id } = e.data;
  try {
    if (action === 'double') {
      self.postMessage({ id, success: true, result: data * 2 });
    } else if (action === 'error') {
      self.postMessage({ id, success: false, error: 'Test error' });
    } else {
      self.postMessage({ id, success: true, result: data });
    }
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};
`;
