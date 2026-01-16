self.onmessage = function (e) {
  const { action, data, id } = e.data;

  try {
    let result;
    let parsed;

    switch (action) {
      case "format":
        parsed = JSON.parse(data);
        result = JSON.stringify(parsed, null, 2);
        break;

      case "minify":
        parsed = JSON.parse(data);
        result = JSON.stringify(parsed);
        break;

      case "validate":
        parsed = JSON.parse(data);
        result = { valid: true, size: JSON.stringify(parsed).length };
        break;

      case "parse":
        parsed = JSON.parse(data);
        result = parsed;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message,
      position: error.message.match(/position (\d+)/)?.[1],
    });
  }
};
