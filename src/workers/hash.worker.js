importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js",
);

self.onmessage = function (e) {
  const { text, algorithms, id } = e.data;

  try {
    const results = {};

    for (const algo of algorithms) {
      switch (algo) {
        case "MD5":
          results.MD5 = CryptoJS.MD5(text).toString();
          break;
        case "SHA1":
          results.SHA1 = CryptoJS.SHA1(text).toString();
          break;
        case "SHA256":
          results.SHA256 = CryptoJS.SHA256(text).toString();
          break;
        case "SHA512":
          results.SHA512 = CryptoJS.SHA512(text).toString();
          break;
      }
    }

    self.postMessage({ id, success: true, results });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};
