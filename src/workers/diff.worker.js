self.onmessage = function (e) {
  const { oldText, newText, type, id } = e.data;

  try {
    let result;

    switch (type) {
      case "lines":
        result = diffLines(oldText, newText);
        break;
      case "words":
        result = diffWords(oldText, newText);
        break;
      case "chars":
        result = diffChars(oldText, newText);
        break;
      case "sentences":
        result = diffSentences(oldText, newText);
        break;
      default:
        result = diffLines(oldText, newText);
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};

function diffLines(oldText, newText) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const result = [];
  let oldI = 0,
    newI = 0;

  while (oldI < oldLines.length || newI < newLines.length) {
    if (oldI >= oldLines.length) {
      result.push({ value: newLines[newI] + "\n", added: true });
      newI++;
    } else if (newI >= newLines.length) {
      result.push({ value: oldLines[oldI] + "\n", removed: true });
      oldI++;
    } else if (oldLines[oldI] === newLines[newI]) {
      result.push({ value: oldLines[oldI] + "\n" });
      oldI++;
      newI++;
    } else {
      const oldNext = oldLines.indexOf(newLines[newI], oldI);
      const newNext = newLines.indexOf(oldLines[oldI], newI);

      if (oldNext === -1 && newNext === -1) {
        result.push({ value: oldLines[oldI] + "\n", removed: true });
        result.push({ value: newLines[newI] + "\n", added: true });
        oldI++;
        newI++;
      } else if (
        newNext !== -1 &&
        (oldNext === -1 || newNext - newI < oldNext - oldI)
      ) {
        for (let i = newI; i < newNext; i++) {
          result.push({ value: newLines[i] + "\n", added: true });
        }
        newI = newNext;
      } else {
        for (let i = oldI; i < oldNext; i++) {
          result.push({ value: oldLines[i] + "\n", removed: true });
        }
        oldI = oldNext;
      }
    }
  }

  return result;
}

function diffWords(oldText, newText) {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  return computeDiff(oldWords, newWords, "word");
}

function diffChars(oldText, newText) {
  const oldChars = oldText.split("");
  const newChars = newText.split("");

  return computeDiff(oldChars, newChars, "char");
}

function diffSentences(oldText, newText) {
  const oldSentences = oldText.match(/[^.!?]+[.!?]+/g) || [];
  const newSentences = newText.match(/[^.!?]+[.!?]+/g) || [];

  return computeDiff(oldSentences, newSentences, "sentence");
}

function computeDiff(oldArr, newArr, valueType) {
  const result = [];
  const m = oldArr.length;
  const n = newArr.length;

  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldArr[i - 1] === newArr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m,
    j = n;
  const lcs = [];

  while (i > 0 && j > 0) {
    if (oldArr[i - 1] === newArr[j - 1]) {
      lcs.unshift({ value: oldArr[i - 1], type: "unchanged" });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  let oldIdx = 0,
    newIdx = 0;
  for (const item of lcs) {
    while (oldIdx < m && oldArr[oldIdx] !== item.value) {
      const val = oldArr[oldIdx];
      if (val.trim()) {
        result.push({ value: val, type: "removed" });
      }
      oldIdx++;
    }
    while (newIdx < n && newArr[newIdx] !== item.value) {
      const val = newArr[newIdx];
      if (val.trim()) {
        result.push({ value: val, type: "added" });
      }
      newIdx++;
    }

    result.push({ value: item.value, type: "unchanged" });
    oldIdx++;
    newIdx++;
  }

  while (oldIdx < m) {
    const val = oldArr[oldIdx];
    if (val.trim()) {
      result.push({ value: val, type: "removed" });
    }
    oldIdx++;
  }

  while (newIdx < n) {
    const val = newArr[newIdx];
    if (val.trim()) {
      result.push({ value: val, type: "added" });
    }
    newIdx++;
  }

  return result;
}
