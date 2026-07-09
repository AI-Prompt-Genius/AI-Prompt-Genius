var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .wrangler/tmp/bundle-6Uj226/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-6Uj226/checked-fetch.js"() {
    "use strict";
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-6Uj226/middleware-loader.entry.ts
var import_checked_fetch33 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-6Uj226/middleware-insertion-facade.js
var import_checked_fetch31 = __toESM(require_checked_fetch());

// src/index.ts
var import_checked_fetch28 = __toESM(require_checked_fetch());

// node_modules/jose/dist/webapi/index.js
var import_checked_fetch24 = __toESM(require_checked_fetch(), 1);

// node_modules/jose/dist/webapi/util/base64url.js
var import_checked_fetch4 = __toESM(require_checked_fetch(), 1);

// node_modules/jose/dist/webapi/lib/buffer_utils.js
var import_checked_fetch2 = __toESM(require_checked_fetch(), 1);
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
__name(encode, "encode");

// node_modules/jose/dist/webapi/lib/base64.js
var import_checked_fetch3 = __toESM(require_checked_fetch(), 1);
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase64, "decodeBase64");

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");

// node_modules/jose/dist/webapi/lib/crypto_key.js
var import_checked_fetch5 = __toESM(require_checked_fetch(), 1);
var unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
var isAlgorithm = /* @__PURE__ */ __name((algorithm, name) => algorithm.name === name, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
__name(checkHashLength, "checkHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
var import_checked_fetch6 = __toESM(require_checked_fetch(), 1);
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalidKeyInput = /* @__PURE__ */ __name((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
var withAlg = /* @__PURE__ */ __name((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");

// node_modules/jose/dist/webapi/util/errors.js
var import_checked_fetch7 = __toESM(require_checked_fetch(), 1);
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static {
    __name(this, "JWKSInvalid");
  }
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static {
    __name(this, "JWKSNoMatchingKey");
  }
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  static {
    __name(this, "JWKSMultipleMatchingKeys");
  }
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static {
    __name(this, "JWKSTimeout");
  }
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/webapi/lib/is_key_like.js
var import_checked_fetch8 = __toESM(require_checked_fetch(), 1);
var isCryptoKey = /* @__PURE__ */ __name((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");

// node_modules/jose/dist/webapi/lib/helpers.js
var import_checked_fetch9 = __toESM(require_checked_fetch(), 1);
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
__name(decodeBase64url, "decodeBase64url");

// node_modules/jose/dist/webapi/lib/type_checks.js
var import_checked_fetch10 = __toESM(require_checked_fetch(), 1);
var isObjectLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
__name(isDisjoint, "isDisjoint");
var isJWK = /* @__PURE__ */ __name((key) => isObject(key) && typeof key.kty === "string", "isJWK");
var isPrivateJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
var isPublicJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
var isSecretJWK = /* @__PURE__ */ __name((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");

// node_modules/jose/dist/webapi/lib/signing.js
var import_checked_fetch11 = __toESM(require_checked_fetch(), 1);
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
__name(checkKeyLength, "checkKeyLength");
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleAlgorithm, "subtleAlgorithm");
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
__name(getSigKey, "getSigKey");
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
__name(verify, "verify");

// node_modules/jose/dist/webapi/lib/normalize_key.js
var import_checked_fetch13 = __toESM(require_checked_fetch(), 1);

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
var import_checked_fetch12 = __toESM(require_checked_fetch(), 1);
var unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
__name(jwkToKey, "jwkToKey");

// node_modules/jose/dist/webapi/lib/normalize_key.js
var unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
var cache;
var handleJWK = /* @__PURE__ */ __name(async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError(unusableForAlg);
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError(unusableForAlg);
    }
    const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
    if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError(unusableForAlg);
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
__name(normalizeKey, "normalizeKey");

// node_modules/jose/dist/webapi/key/import.js
var import_checked_fetch14 = __toESM(require_checked_fetch(), 1);
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwkToKey({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== void 0 && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwkToKey({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwkToKey({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");

// node_modules/jose/dist/webapi/lib/validate_crit.js
var import_checked_fetch15 = __toESM(require_checked_fetch(), 1);
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
var import_checked_fetch16 = __toESM(require_checked_fetch(), 1);
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");

// node_modules/jose/dist/webapi/lib/check_key_type.js
var import_checked_fetch17 = __toESM(require_checked_fetch(), 1);
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
}, "asymmetricTypeCheck");
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
__name(checkKeyType, "checkKeyType");

// node_modules/jose/dist/webapi/jws/compact/verify.js
var import_checked_fetch19 = __toESM(require_checked_fetch(), 1);

// node_modules/jose/dist/webapi/jws/flattened/verify.js
var import_checked_fetch18 = __toESM(require_checked_fetch(), 1);
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// node_modules/jose/dist/webapi/jwt/verify.js
var import_checked_fetch21 = __toESM(require_checked_fetch(), 1);

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var import_checked_fetch20 = __toESM(require_checked_fetch(), 1);
var epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
__name(secs, "secs");
var normalizeTyp = /* @__PURE__ */ __name((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// node_modules/jose/dist/webapi/jwks/local.js
var import_checked_fetch22 = __toESM(require_checked_fetch(), 1);
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
__name(getKtyFromAlg, "getKtyFromAlg");
function isJWKSLike(jwks2) {
  return jwks2 && typeof jwks2 === "object" && Array.isArray(jwks2.keys) && jwks2.keys.every(isJWKLike);
}
__name(isJWKSLike, "isJWKSLike");
function isJWKLike(key) {
  return isObject(key);
}
__name(isJWKLike, "isJWKLike");
var LocalJWKSet = class {
  static {
    __name(this, "LocalJWKSet");
  }
  #jwks;
  #cached = /* @__PURE__ */ new WeakMap();
  constructor(jwks2) {
    if (!isJWKSLike(jwks2)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this.#jwks = structuredClone(jwks2);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey();
    }
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      const _cached = this.#cached;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {
          }
        }
      };
      throw error;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
};
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
__name(importWithAlgCache, "importWithAlgCache");
function createLocalJWKSet(jwks2) {
  const set = new LocalJWKSet(jwks2);
  const localJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "localJWKSet");
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: /* @__PURE__ */ __name(() => structuredClone(set.jwks()), "value"),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}
__name(createLocalJWKSet, "createLocalJWKSet");

// node_modules/jose/dist/webapi/jwks/remote.js
var import_checked_fetch23 = __toESM(require_checked_fetch(), 1);
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && true || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
__name(isCloudflareWorkers, "isCloudflareWorkers");
var USER_AGENT;
if (typeof navigator === "undefined" || !"Cloudflare-Workers"?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v6.2.3";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var customFetch = /* @__PURE__ */ Symbol();
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout();
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
__name(fetchJwks, "fetchJwks");
var jwksCache = /* @__PURE__ */ Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}
__name(isFreshJwksCache, "isFreshJwksCache");
var RemoteJWKSet = class {
  static {
    __name(this, "RemoteJWKSet");
  }
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent")) {
      this.#headers.set("User-Agent", USER_AGENT);
    }
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== void 0) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers()) {
      this.#pendingFetch = void 0;
    }
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json4) => {
      this.#local = createLocalJWKSet(json4);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json4;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = void 0;
    }).catch((err) => {
      this.#pendingFetch = void 0;
      throw err;
    });
    await this.#pendingFetch;
  }
};
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "remoteJWKSet");
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: /* @__PURE__ */ __name(() => set.coolingDown(), "get"),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: /* @__PURE__ */ __name(() => set.fresh(), "get"),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: /* @__PURE__ */ __name(() => set.reload(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: /* @__PURE__ */ __name(() => set.pendingFetch(), "get"),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: /* @__PURE__ */ __name(() => set.jwks(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
__name(createRemoteJWKSet, "createRemoteJWKSet");

// src/auth.ts
var import_checked_fetch26 = __toESM(require_checked_fetch());

// src/user.ts
var import_checked_fetch25 = __toESM(require_checked_fetch());
var WORKOS = "https://api.workos.com";
async function deleteUserAccount(env, userId) {
  await env.DB.prepare("DELETE FROM prompts WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("DELETE FROM folders WHERE user_id = ?").bind(userId).run();
  try {
    await env.DB.prepare("DELETE FROM user_settings WHERE user_id = ?").bind(userId).run();
  } catch (err) {
    console.error("user_settings delete skipped", err);
  }
  if (env.WORKOS_API_KEY) {
    await fetch(`${WORKOS}/user_management/users/${userId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` }
    });
  }
}
__name(deleteUserAccount, "deleteUserAccount");

// src/auth.ts
var WORKOS2 = "https://api.workos.com";
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "POST, OPTIONS"
    }
  });
}
__name(json, "json");
async function workos(env, path, body) {
  const payload = path === "/user_management/authenticate" ? { ...body, client_secret: env.WORKOS_API_KEY } : body;
  return fetch(`${WORKOS2}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.WORKOS_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
__name(workos, "workos");
async function relayAuthResult(res) {
  const data = await res.json();
  if (res.ok) {
    return json({
      status: "complete",
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: { id: data.user?.id, email: data.user?.email }
    });
  }
  const code = data.code ?? data.error;
  if (code === "email_verification_required") {
    return json(
      {
        status: "email_verification_required",
        pendingAuthenticationToken: data.pending_authentication_token,
        email: data.email
      },
      200
    );
  }
  if (code === "mfa_challenge" || code === "mfa_enrollment") {
    return json(
      {
        status: "mfa_challenge",
        pendingAuthenticationToken: data.pending_authentication_token,
        factors: (data.authentication_factors ?? []).map((f) => ({
          id: f.id,
          type: f.type
        }))
      },
      200
    );
  }
  return json({ status: "error", code, message: data.message ?? "Authentication failed" }, 400);
}
__name(relayAuthResult, "relayAuthResult");
async function handleAuth(req, env, pathname, verifiedUserId) {
  if (!env.WORKOS_API_KEY) {
    return json({ status: "error", message: "auth not configured (missing API key)" }, 500);
  }
  const body = await req.json().catch(() => ({}));
  switch (pathname) {
    case "/auth/signup": {
      const created = await workos(env, "/user_management/users", {
        email: body.email,
        password: body.password
      });
      if (!created.ok) {
        const err = await created.json();
        return json(
          { status: "error", code: err.code, message: err.message ?? "Sign-up failed" },
          400
        );
      }
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "password",
          email: body.email,
          password: body.password
        })
      );
    }
    case "/auth/signin":
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "password",
          email: body.email,
          password: body.password
        })
      );
    case "/auth/verify-email":
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "urn:workos:oauth:grant-type:email-verification:code",
          pending_authentication_token: body.pendingAuthenticationToken,
          code: body.code
        })
      );
    case "/auth/password-reset": {
      await workos(env, "/user_management/password_reset", { email: body.email });
      return json({ status: "ok" });
    }
    case "/auth/password-reset/confirm": {
      const res = await workos(env, "/user_management/password_reset/confirm", {
        token: body.token,
        new_password: body.newPassword
      });
      const data = await res.json();
      if (!res.ok) {
        return json(
          {
            status: "error",
            code: data.code,
            message: data.message ?? "Couldn't reset your password \u2014 the link may have expired."
          },
          400
        );
      }
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "password",
          email: data.user?.email,
          password: body.newPassword
        })
      );
    }
    case "/auth/mfa/challenge": {
      const res = await fetch(
        `${WORKOS2}/auth/factors/${body.authenticationFactorId}/challenge`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` }
        }
      );
      const data = await res.json();
      if (!res.ok) return json({ status: "error", message: data.message }, 400);
      return json({
        status: "ok",
        authenticationChallengeId: data.id ?? data.authentication_challenge?.id
      });
    }
    case "/auth/mfa/verify":
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "urn:workos:oauth:grant-type:mfa-totp",
          pending_authentication_token: body.pendingAuthenticationToken,
          authentication_challenge_id: body.authenticationChallengeId,
          code: body.code
        })
      );
    case "/auth/callback":
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "authorization_code",
          code: body.code
        })
      );
    case "/auth/refresh":
      return relayAuthResult(
        await workos(env, "/user_management/authenticate", {
          client_id: env.WORKOS_CLIENT_ID,
          grant_type: "refresh_token",
          refresh_token: body.refreshToken
        })
      );
    case "/auth/mfa/enroll": {
      if (!verifiedUserId) return json({ status: "error", message: "unauthorized" }, 401);
      const res = await fetch(
        `${WORKOS2}/user_management/users/${verifiedUserId}/auth_factors`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.WORKOS_API_KEY}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({ type: "totp", totp_issuer: "AI Prompt Genius" })
        }
      );
      const data = await res.json();
      if (!res.ok) return json({ status: "error", message: data.message }, 400);
      const factor = data.authentication_factor ?? data;
      return json({
        status: "ok",
        factorId: factor.id,
        qrCode: factor.totp?.qr_code,
        secret: factor.totp?.secret
      });
    }
    case "/auth/mfa/verify-enroll": {
      if (!verifiedUserId) return json({ status: "error", message: "unauthorized" }, 401);
      const res = await fetch(
        `${WORKOS2}/auth/challenges/${body.authenticationChallengeId}/verify`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.WORKOS_API_KEY}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({ code: body.code })
        }
      );
      const data = await res.json();
      if (!res.ok || data.valid === false) {
        return json(
          {
            status: "error",
            message: data.message ?? "That code didn't match. Try again."
          },
          400
        );
      }
      return json({ status: "ok" });
    }
    case "/auth/delete-account": {
      if (!verifiedUserId) return json({ status: "error", message: "unauthorized" }, 401);
      try {
        await deleteUserAccount(env, verifiedUserId);
        return json({ status: "ok" });
      } catch (err) {
        console.error("account deletion failed", err);
        return json({ status: "error", message: "Account deletion failed" }, 500);
      }
    }
    default:
      return json({ status: "error", message: "not found" }, 404);
  }
}
__name(handleAuth, "handleAuth");

// src/admin.ts
var import_checked_fetch27 = __toESM(require_checked_fetch());
var WORKOS3 = "https://api.workos.com";
function json2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET, POST, OPTIONS"
    }
  });
}
__name(json2, "json");
function isAdmin(req, env) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return !!env.ADMIN_TOKEN && token.length === env.ADMIN_TOKEN.length && token === env.ADMIN_TOKEN;
}
__name(isAdmin, "isAdmin");
async function listWorkosUsers(env) {
  const map = /* @__PURE__ */ new Map();
  if (!env.WORKOS_API_KEY) return map;
  let after;
  for (let page = 0; page < 100; page++) {
    const u = new URL(`${WORKOS3}/user_management/users`);
    u.searchParams.set("limit", "100");
    if (after) u.searchParams.set("after", after);
    const res = await fetch(u.toString(), {
      headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` }
    });
    if (!res.ok) break;
    const data = await res.json();
    for (const usr of data.data ?? []) {
      map.set(usr.id, { email: usr.email, createdAt: usr.created_at });
    }
    after = data.list_metadata?.after ?? void 0;
    if (!after) break;
  }
  return map;
}
__name(listWorkosUsers, "listWorkosUsers");
async function activePromos(env) {
  const rows = await env.DB.prepare(
    `SELECT id, name, url FROM promos
         WHERE active = 1 AND date('now') BETWEEN start_date AND end_date
         ORDER BY created_at`
  ).all();
  return rows.results ?? [];
}
__name(activePromos, "activePromos");
async function handlePublicPromos(env) {
  try {
    return json2({ promos: await activePromos(env) });
  } catch {
    return json2({ promos: [] });
  }
}
__name(handlePublicPromos, "handlePublicPromos");
async function handleAdmin(req, env, pathname) {
  if (pathname === "/admin" && req.method === "GET") {
    return new Response(ADMIN_HTML, {
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }
  if (!pathname.startsWith("/admin/api/")) return json2({ error: "not found" }, 404);
  if (!isAdmin(req, env)) return json2({ error: "unauthorized" }, 401);
  if (pathname === "/admin/api/users" && req.method === "GET") {
    const agg = await env.DB.prepare(
      `SELECT user_id AS userId, COUNT(*) AS prompts,
                    COALESCE(SUM(
                      LENGTH(COALESCE(text,'')) + LENGTH(COALESCE(title,'')) +
                      LENGTH(COALESCE(description,'')) + LENGTH(COALESCE(tags,''))
                    ), 0) AS storageBytes
             FROM prompts WHERE deleted_at IS NULL GROUP BY user_id`
    ).all();
    const byId = /* @__PURE__ */ new Map();
    for (const r of agg.results ?? []) {
      byId.set(r.userId, {
        userId: r.userId,
        email: "",
        prompts: r.prompts,
        storageBytes: r.storageBytes,
        pro: false
      });
    }
    try {
      const pro = await env.DB.prepare(
        "SELECT user_id FROM user_settings WHERE pro_key IS NOT NULL AND pro_key != ''"
      ).all();
      for (const r of pro.results ?? []) {
        const existing = byId.get(r.user_id);
        if (existing) existing.pro = true;
        else byId.set(r.user_id, { userId: r.user_id, email: "", prompts: 0, storageBytes: 0, pro: true });
      }
    } catch (err) {
      console.error("pro status lookup skipped", err);
    }
    const workos2 = await listWorkosUsers(env);
    for (const [id, info] of workos2) {
      const existing = byId.get(id);
      if (existing) existing.email = info.email;
      else byId.set(id, { userId: id, email: info.email, prompts: 0, storageBytes: 0, pro: false });
    }
    const users = [...byId.values()].sort((a, b) => b.storageBytes - a.storageBytes);
    return json2({ users });
  }
  if (pathname === "/admin/api/users/delete" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!b.userId) return json2({ error: "userId required" }, 400);
    try {
      await deleteUserAccount(env, b.userId);
      return json2({ ok: true });
    } catch (err) {
      console.error("admin user deletion failed", err);
      return json2({ error: "deletion failed" }, 500);
    }
  }
  if (pathname === "/admin/api/promos" && req.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, name, url, start_date, end_date, active, created_at FROM promos ORDER BY created_at DESC"
    ).all();
    return json2({ promos: rows.results ?? [] });
  }
  if (pathname === "/admin/api/promos" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!b.name || !b.url || !b.start_date || !b.end_date) {
      return json2({ error: "name, url, start_date and end_date are required" }, 400);
    }
    const id = b.id || crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO promos (id, name, url, start_date, end_date, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name=excluded.name, url=excluded.url, start_date=excluded.start_date,
               end_date=excluded.end_date, active=excluded.active`
    ).bind(id, b.name, b.url, b.start_date, b.end_date, b.active ? 1 : 0, Date.now()).run();
    return json2({ ok: true, id });
  }
  if (pathname === "/admin/api/promos/delete" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!b.id) return json2({ error: "id required" }, 400);
    await env.DB.prepare("DELETE FROM promos WHERE id = ?").bind(b.id).run();
    return json2({ ok: true });
  }
  return json2({ error: "not found" }, 404);
}
__name(handleAdmin, "handleAdmin");
var ADMIN_HTML = (
  /* html */
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AI Prompt Genius \u2014 Admin</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0f1115; color: #e6e8eb; }
  header { padding: 20px 24px; border-bottom: 1px solid #23262e; display: flex; align-items: center;
    justify-content: space-between; gap: 16px; }
  h1 { font-size: 18px; margin: 0; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .06em; color: #9aa0ac; margin: 0 0 12px; }
  main { max-width: 1000px; margin: 0 auto; padding: 24px; }
  section { margin-bottom: 40px; }
  .muted { color: #9aa0ac; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #23262e; }
  th { color: #9aa0ac; font-weight: 600; font-size: 13px; }
  td.num, th.num { text-align: right; }
  tfoot td { font-weight: 700; border-top: 2px solid #33384a; }
  input, button { font: inherit; }
  input { background: #1a1d24; border: 1px solid #2b2f3a; color: #e6e8eb; border-radius: 8px;
    padding: 8px 10px; }
  button { background: #3b82f6; border: 0; color: #fff; border-radius: 8px; padding: 8px 14px;
    cursor: pointer; }
  button.ghost { background: transparent; border: 1px solid #2b2f3a; color: #e6e8eb; }
  button.danger { background: transparent; border: 1px solid #5b2b2b; color: #f2a3a3; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .card { background: #14171d; border: 1px solid #23262e; border-radius: 12px; padding: 16px; }
  .grid { display: grid; grid-template-columns: 1fr 2fr 130px 130px 70px auto; gap: 8px; align-items: center; }
  .pill { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
  .pill.on { background: #14361f; color: #7fd99a; }
  .pill.off { background: #2a2d34; color: #9aa0ac; }
  .pill.pro { background: #3a2f10; color: #f0c674; font-weight: 600; }
  .stat { font-size: 26px; font-weight: 700; }
  #gate { max-width: 420px; margin: 80px auto; }
  .hidden { display: none; }
</style>
</head>
<body>
<header>
  <h1>AI Prompt Genius \u2014 Admin</h1>
  <button id="signout" class="ghost hidden">Sign out</button>
</header>

<div id="gate" class="card">
  <h2>Admin token</h2>
  <p class="muted">Enter the admin token (set via <code>wrangler secret put ADMIN_TOKEN</code>).</p>
  <div class="row">
    <input id="token" type="password" placeholder="Admin token" style="flex:1" />
    <button id="enter">Enter</button>
  </div>
  <p id="gateErr" class="muted"></p>
</div>

<main id="app" class="hidden">
  <section>
    <h2>Users &amp; storage</h2>
    <div class="row" style="justify-content:space-between; margin-bottom:12px">
      <span class="muted">Storage is approximate \u2014 the character length of each prompt's fields.</span>
      <button id="reload" class="ghost">Reload</button>
    </div>
    <table id="usersTable">
      <thead><tr>
        <th>User</th><th>Plan</th><th class="num"># Prompts</th><th class="num">Total storage</th><th></th>
      </tr></thead>
      <tbody></tbody>
      <tfoot></tfoot>
    </table>
  </section>

  <section>
    <h2>Promotions</h2>
    <div id="promos"></div>
    <div class="card" style="margin-top:16px">
      <h2>Add / edit promo</h2>
      <div class="grid" style="grid-template-columns:1fr; gap:10px">
        <input id="p_name" placeholder="Name (label)" />
        <input id="p_url" placeholder="https://\u2026 (tab to open)" />
        <div class="row">
          <label class="muted">Start <input id="p_start" type="date" /></label>
          <label class="muted">End <input id="p_end" type="date" /></label>
          <label class="row" style="gap:6px"><input id="p_active" type="checkbox" checked /> Active</label>
        </div>
        <div class="row">
          <button id="p_save">Save promo</button>
          <button id="p_clear" class="ghost">Clear form</button>
          <input id="p_id" type="hidden" />
        </div>
      </div>
    </div>
  </section>
</main>

<script>
  var token = localStorage.getItem("apg_admin_token") || "";
  var gate = document.getElementById("gate");
  var app = document.getElementById("app");

  function fmtBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(2) + " MB";
  }
  async function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ authorization: "Bearer " + token }, opts.headers || {});
    var res = await fetch(path, opts);
    if (res.status === 401) throw new Error("unauthorized");
    return res.json();
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  async function loadUsers() {
    var data = await api("/admin/api/users");
    var tb = document.querySelector("#usersTable tbody");
    var tf = document.querySelector("#usersTable tfoot");
    tb.innerHTML = "";
    var totalBytes = 0, totalPrompts = 0, proCount = 0;
    (data.users || []).forEach(function (u) {
      totalBytes += u.storageBytes; totalPrompts += u.prompts; if (u.pro) proCount++;
      var label = u.email || u.userId;
      var plan = u.pro
        ? "<span class='pill pro'>Pro</span>"
        : "<span class='pill off'>Free</span>";
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + esc(label) + "</td>" +
        "<td>" + plan + "</td>" +
        "<td class='num'>" + u.prompts + "</td>" +
        "<td class='num'>" + fmtBytes(u.storageBytes) + "</td>" +
        "<td class='num'><button class='danger' data-del-user>Delete</button></td>";
      tr.querySelector("[data-del-user]").onclick = function () {
        // Strict confirmation: require typing the exact user identifier before we purge.
        var typed = prompt("This permanently deletes " + label + "'s account, all their prompts, and their login. This cannot be undone.\\n\\nType \\"" + label + "\\" to confirm:");
        if (typed !== label) { if (typed !== null) alert("Didn't match \u2014 nothing was deleted."); return; }
        api("/admin/api/users/delete", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: u.userId }),
        }).then(function (res) {
          if (res && res.error) { alert(res.error); return; }
          loadUsers();
        });
      };
      tb.appendChild(tr);
    });
    tf.innerHTML = "<tr><td>" + (data.users || []).length + " users</td>" +
      "<td>" + proCount + " Pro</td>" +
      "<td class='num'>" + totalPrompts + "</td>" +
      "<td class='num'>" + fmtBytes(totalBytes) + "</td><td></td></tr>";
  }

  async function loadPromos() {
    var data = await api("/admin/api/promos");
    var box = document.getElementById("promos");
    box.innerHTML = "";
    (data.promos || []).forEach(function (p) {
      var el = document.createElement("div");
      el.className = "card";
      el.style.marginBottom = "8px";
      el.innerHTML =
        "<div class='row' style='justify-content:space-between'>" +
          "<div><strong>" + esc(p.name) + "</strong> " +
            "<span class='pill " + (p.active ? "on" : "off") + "'>" + (p.active ? "active" : "off") + "</span>" +
            "<div class='muted' style='font-size:13px'>" + esc(p.url) + "</div>" +
            "<div class='muted' style='font-size:13px'>" + esc(p.start_date) + " \u2192 " + esc(p.end_date) + "</div>" +
          "</div>" +
          "<div class='row'><button class='ghost' data-edit>Edit</button>" +
          "<button class='danger' data-del>Delete</button></div>" +
        "</div>";
      el.querySelector("[data-edit]").onclick = function () {
        document.getElementById("p_id").value = p.id;
        document.getElementById("p_name").value = p.name;
        document.getElementById("p_url").value = p.url;
        document.getElementById("p_start").value = p.start_date;
        document.getElementById("p_end").value = p.end_date;
        document.getElementById("p_active").checked = !!p.active;
        window.scrollTo(0, document.body.scrollHeight);
      };
      el.querySelector("[data-del]").onclick = async function () {
        if (!confirm("Delete promo '" + p.name + "'?")) return;
        await api("/admin/api/promos/delete", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: p.id }),
        });
        loadPromos();
      };
      box.appendChild(el);
    });
    if (!(data.promos || []).length) box.innerHTML = "<p class='muted'>No promos yet.</p>";
  }

  function clearForm() {
    ["p_id", "p_name", "p_url", "p_start", "p_end"].forEach(function (id) {
      document.getElementById(id).value = "";
    });
    document.getElementById("p_active").checked = true;
  }

  document.getElementById("p_save").onclick = async function () {
    var payload = {
      id: document.getElementById("p_id").value || undefined,
      name: document.getElementById("p_name").value.trim(),
      url: document.getElementById("p_url").value.trim(),
      start_date: document.getElementById("p_start").value,
      end_date: document.getElementById("p_end").value,
      active: document.getElementById("p_active").checked,
    };
    if (!payload.name || !payload.url || !payload.start_date || !payload.end_date) {
      alert("Name, URL, start and end dates are all required."); return;
    }
    var res = await api("/admin/api/promos", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.error) { alert(res.error); return; }
    clearForm();
    loadPromos();
  };
  document.getElementById("p_clear").onclick = clearForm;
  document.getElementById("reload").onclick = function () { loadUsers(); };

  async function boot() {
    gate.classList.add("hidden");
    app.classList.remove("hidden");
    document.getElementById("signout").classList.remove("hidden");
    try { await loadUsers(); await loadPromos(); }
    catch (e) { signOut(); document.getElementById("gateErr").textContent = "Invalid token."; }
  }
  function signOut() {
    token = ""; localStorage.removeItem("apg_admin_token");
    app.classList.add("hidden");
    document.getElementById("signout").classList.add("hidden");
    gate.classList.remove("hidden");
  }
  document.getElementById("enter").onclick = function () {
    token = document.getElementById("token").value.trim();
    localStorage.setItem("apg_admin_token", token);
    boot();
  };
  document.getElementById("token").addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("enter").click();
  });
  document.getElementById("signout").onclick = signOut;

  if (token) boot();
<\/script>
</body>
</html>`
);

// src/index.ts
function safeParse(s) {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
__name(safeParse, "safeParse");
function json3(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "POST, OPTIONS"
    }
  });
}
__name(json3, "json");
var jwks = null;
async function verifyWorkosToken(req, env) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    jwks ??= createRemoteJWKSet(
      new URL(`https://api.workos.com/sso/jwks/${env.WORKOS_CLIENT_ID}`)
    );
    const { payload } = await jwtVerify(token, jwks, {
      // AuthKit user-management tokens are issued per-client, not by the bare API origin.
      issuer: `https://api.workos.com/user_management/${env.WORKOS_CLIENT_ID}`
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
__name(verifyWorkosToken, "verifyWorkosToken");
var src_default = {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return json3({});
    const url = new URL(req.url);
    if (url.pathname === "/promos" && req.method === "GET") {
      return handlePublicPromos(env);
    }
    if (url.pathname.startsWith("/admin")) {
      return handleAdmin(req, env, url.pathname);
    }
    if (url.pathname.startsWith("/auth/") && req.method === "POST") {
      const userId = await verifyWorkosToken(req, env);
      return handleAuth(req, env, url.pathname, userId);
    }
    if (url.pathname === "/sync" && req.method === "POST") {
      const userId = await verifyWorkosToken(req, env);
      if (!userId) return json3({ error: "unauthorized" }, 401);
      const body = await req.json();
      const sinceRev = body.sinceRev ?? 0;
      const revRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(rev), 0) AS rev FROM prompts WHERE user_id = ?"
      ).bind(userId).first();
      const folderRevRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(rev), 0) AS rev FROM folders WHERE user_id = ?"
      ).bind(userId).first();
      const nextRev = Math.max(revRow?.rev ?? 0, folderRevRow?.rev ?? 0) + 1;
      for (const p of body.prompts ?? []) {
        await env.DB.prepare(
          `INSERT INTO prompts (user_id, id, title, text, description, tags, folder, sort_index, rev, updated_at, deleted_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                     ON CONFLICT(user_id, id) DO UPDATE SET
                       title=excluded.title, text=excluded.text, description=excluded.description,
                       tags=excluded.tags, folder=excluded.folder, sort_index=excluded.sort_index,
                       rev=excluded.rev, updated_at=excluded.updated_at, deleted_at=NULL
                     WHERE excluded.updated_at >= prompts.updated_at`
        ).bind(
          userId,
          p.id,
          p.title ?? "",
          p.text ?? "",
          p.description ?? "",
          (p.tags ?? []).join(";"),
          p.folder ?? "",
          p.sortIndex ?? 0,
          nextRev,
          p.lastChanged ?? Date.now()
        ).run();
      }
      for (const id of body.deletedPromptIds ?? []) {
        await env.DB.prepare(
          `UPDATE prompts SET deleted_at = ?, rev = ? WHERE user_id = ? AND id = ?`
        ).bind(Date.now(), nextRev, userId, id).run();
      }
      if (body.folders) {
        await env.DB.prepare(
          `UPDATE folders SET deleted_at = ?, rev = ? WHERE user_id = ? AND deleted_at IS NULL`
        ).bind(Date.now(), nextRev, userId).run();
        let i = 0;
        for (const name of body.folders) {
          await env.DB.prepare(
            `INSERT INTO folders (user_id, name, sort_index, rev, deleted_at)
                         VALUES (?, ?, ?, ?, NULL)
                         ON CONFLICT(user_id, name) DO UPDATE SET sort_index=excluded.sort_index, rev=excluded.rev, deleted_at=NULL`
          ).bind(userId, name, i++, nextRev).run();
        }
      }
      let settingsOut = {
        data: {},
        updatedAt: 0
      };
      let proKeyOut = null;
      try {
        const existing = await env.DB.prepare(
          "SELECT data, updated_at, pro_key FROM user_settings WHERE user_id = ?"
        ).bind(userId).first();
        const serverUpdatedAt = existing?.updated_at ?? 0;
        const incoming = body.settings;
        const winData = incoming && incoming.updatedAt > serverUpdatedAt ? incoming.data : existing ? safeParse(existing.data) : {};
        const winUpdatedAt = incoming && incoming.updatedAt > serverUpdatedAt ? incoming.updatedAt : serverUpdatedAt;
        const proKey = body.proKey === void 0 ? existing?.pro_key ?? null : body.proKey;
        if (incoming || body.proKey !== void 0 || !existing) {
          await env.DB.prepare(
            `INSERT INTO user_settings (user_id, data, updated_at, pro_key)
                         VALUES (?, ?, ?, ?)
                         ON CONFLICT(user_id) DO UPDATE SET
                           data=excluded.data, updated_at=excluded.updated_at, pro_key=excluded.pro_key`
          ).bind(userId, JSON.stringify(winData), winUpdatedAt, proKey).run();
        }
        settingsOut = { data: winData, updatedAt: winUpdatedAt };
        proKeyOut = proKey;
      } catch (err) {
        console.error("settings sync skipped", err);
      }
      const changedPrompts = await env.DB.prepare(
        "SELECT * FROM prompts WHERE user_id = ? AND rev > ? ORDER BY sort_index"
      ).bind(userId, sinceRev).all();
      const changedFolders = await env.DB.prepare(
        "SELECT name, sort_index FROM folders WHERE user_id = ? AND rev > ? AND deleted_at IS NULL ORDER BY sort_index"
      ).bind(userId, sinceRev).all();
      return json3({
        rev: nextRev,
        prompts: changedPrompts.results,
        folders: changedFolders.results.map((f) => f.name),
        settings: settingsOut,
        proKey: proKeyOut
      });
    }
    return json3({ error: "not found" }, 404);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch29 = __toESM(require_checked_fetch());
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch30 = __toESM(require_checked_fetch());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-6Uj226/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch32 = __toESM(require_checked_fetch());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-6Uj226/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
