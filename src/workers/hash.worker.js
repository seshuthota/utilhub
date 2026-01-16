// Hash Worker - Uses Web Crypto API (no external dependencies)

async function hashText(text, algorithm) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

self.onmessage = async function (e) {
  const { text, algorithms, id } = e.data;

  try {
    const results = {};
    const algorithmMap = {
      MD5: "MD5", // Not supported in Web Crypto, will use fallback
      SHA1: "SHA-1",
      SHA256: "SHA-256",
      SHA512: "SHA-512",
    };

    for (const algo of algorithms) {
      const webCryptoAlgo = algorithmMap[algo];
      if (webCryptoAlgo) {
        results[algo] = await hashText(text, webCryptoAlgo);
      } else if (algo === "MD5") {
        // MD5 fallback using simple implementation
        results.MD5 = md5(text);
      }
    }

    self.postMessage({ id, success: true, results });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};

// Simple MD5 implementation for fallback
function md5(str) {
  let xl;
  let r;
  let k;
  let s1;
  let s2;
  let a;
  let b;
  let c;
  let d;
  let e;
  let f;
  let g;
  let h;
  let i1;
  let j;
  let k1;
  let k2;
  let k3;
  let k4;
  let k5;
  let k6;
  let k7;
  let k8;
  let k9;
  let k10;
  let k11;
  let k12;
  let k13;
  let k14;
  let k15;
  let k16;
  let k17;
  let k18;
  let k19;
  let k20;
  let k21;
  let k22;
  let k23;
  let k24;
  let k25;
  let k26;
  let k27;
  let k28;
  let k29;
  let k30;
  let k31;
  let k32;
  let k33;
  let k34;
  let k35;
  let k36;
  let k37;
  let k38;
  let k39;
  let k40;
  let k41;
  let k42;
  let k43;
  let k44;
  let k45;
  let k46;
  let k47;
  let k48;
  let k49;
  let k50;
  let k51;
  let k52;
  let k53;
  let k54;
  let k55;
  let k56;
  let k57;
  let k58;
  let k59;
  let k60;
  let k61;
  let k62;
  let k63;
  let k64;

  // MD5 implementation
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function md5ff(a, b, c, d, x, s, t) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function md5gg(a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const str2binl = function (str) {
    const bin = [];
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << (i % 32);
    }
    return bin;
  };

  const binl2hex = function (bin) {
    const hexTab = "0123456789abcdef";
    let str = "";
    for (let i = 0; i < bin.length * 4; i++) {
      str +=
        hexTab.charAt((bin[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
        hexTab.charAt((bin[i >> 2] >> ((i % 4) * 8)) & 0xf);
    }
    return str;
  };

  let x = str2binl(str);

  a = 1732584193;
  b = 4023233417;
  c = 2562383102;
  d = 271733878;

  const originalA = a;
  const originalB = b;
  const originalC = c;
  const originalD = d;

  x[((str.length + 8) / 64) | 16] = str.length * 8;

  for (let i = 0; i < x.length; i += 16) {
    a = md5ff(a, b, c, d, x[i + 0], 7, 3614090360);
    d = md5ff(d, a, b, c, x[i + 1], 12, 3905402710);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, 3250441966);
    a = md5ff(a, b, c, d, x[i + 4], 7, 4118548399);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, 2821735955);
    b = md5ff(b, c, d, a, x[i + 7], 22, 1968342293);
    a = md5ff(a, b, c, d, x[i + 8], 7, 2563907313);
    d = md5ff(d, a, b, c, x[i + 9], 12, 2287018905);
    c = md5ff(c, d, a, b, x[i + 10], 17, 2142921786);
    b = md5ff(b, c, d, a, x[i + 11], 22, 1013017422);
    a = md5ff(a, b, c, d, x[i + 12], 7, 2069002298);
    d = md5ff(d, a, b, c, x[i + 13], 12, 3716258465);
    c = md5ff(c, d, a, b, x[i + 14], 17, 655878956);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1011888568);

    a = md5gg(a, b, c, d, x[i + 1], 5, 1352818221);
    d = md5gg(d, a, b, c, x[i + 6], 9, 1555267606);
    c = md5gg(c, d, a, b, x[i + 11], 14, 1833508855);
    b = md5gg(b, c, d, a, x[i + 0], 20, 530743520);
    a = md5gg(a, b, c, d, x[i + 5], 5, 1725223141);
    d = md5gg(d, a, b, c, x[i + 10], 9, 2044264329);
    c = md5gg(c, d, a, b, x[i + 15], 14, 3218676425);
    b = md5gg(b, c, d, a, x[i + 4], 20, 1913082357);
    a = md5gg(a, b, c, d, x[i + 9], 5, 2413046328);
    d = md5gg(d, a, b, c, x[i + 14], 9, 1681065413);
    c = md5gg(c, d, a, b, x[i + 3], 14, 3868291495);
    b = md5gg(b, c, d, a, x[i + 8], 20, 2134896923);
    a = md5gg(a, b, c, d, x[i + 13], 5, 1295500155);
    d = md5gg(d, a, b, c, x[i + 2], 9, 3067519938);
    c = md5gg(c, d, a, b, x[i + 7], 14, 3538934895);
    b = md5gg(b, c, d, a, x[i + 12], 20, 2026008900);

    a = md5hh(a, b, c, d, x[i + 5], 4, 2099414864);
    d = md5hh(d, a, b, c, x[i + 8], 11, 2287960266);
    c = md5hh(c, d, a, b, x[i + 11], 16, 3315763906);
    b = md5hh(b, c, d, a, x[i + 14], 23, 4090054203);
    a = md5hh(a, b, c, d, x[i + 1], 4, 1013017421);
    d = md5hh(d, a, b, c, x[i + 4], 11, 3290440754);
    c = md5hh(c, d, a, b, x[i + 7], 16, 1725223140);
    b = md5hh(b, c, d, a, x[i + 10], 23, 2142921786);
    a = md5hh(a, b, c, d, x[i + 13], 4, 2044264328);
    d = md5hh(d, a, b, c, x[i + 0], 11, 3218676425);
    c = md5hh(c, d, a, b, x[i + 3], 16, 1968342293);
    b = md5hh(b, c, d, a, x[i + 6], 23, 530743520);
    a = md5hh(a, b, c, d, x[i + 9], 4, 3443509868);
    d = md5hh(d, a, b, c, x[i + 12], 11, 1555267606);
    c = md5hh(c, d, a, b, x[i + 15], 16, 1833508855);
    b = md5hh(b, c, d, a, x[i + 2], 23, 1352818221);

    a = md5ii(a, b, c, d, x[i + 0], 6, 1509613993);
    d = md5ii(d, a, b, c, x[i + 7], 10, 242706502);
    c = md5ii(c, d, a, b, x[i + 14], 15, 1456698979);
    b = md5ii(b, c, d, a, x[i + 5], 21, 3077014682);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1036496937);
    d = md5ii(d, a, b, c, x[i + 3], 10, 240280506);
    c = md5ii(c, d, a, b, x[i + 10], 15, 310596659);
    b = md5ii(b, c, d, a, x[i + 1], 21, 4223715846);
    a = md5ii(a, b, c, d, x[i + 8], 6, 3812106274);
    d = md5ii(d, a, b, c, x[i + 15], 10, 1906902400);
    c = md5ii(c, d, a, b, x[i + 6], 15, 2783189814);
    b = md5ii(b, c, d, a, x[i + 13], 21, 3033991938);
    a = md5ii(a, b, c, d, x[i + 4], 6, 3759198073);
    d = md5ii(d, a, b, c, x[i + 11], 10, 4100752289);
    c = md5ii(c, d, a, b, x[i + 2], 15, 1522806554);
    b = md5ii(b, c, d, a, x[i + 9], 21, 3067016507);

    a = safeAdd(a, originalA);
    b = safeAdd(b, originalB);
    c = safeAdd(c, originalC);
    d = safeAdd(d, originalD);
  }

  return binl2hex([a, b, c, d]);
}
