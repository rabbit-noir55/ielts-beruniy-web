import {
  getBiometricAuthOptions,
  getBiometricRegisterOptions,
  registerBiometricCredential,
  removeBiometricCredential,
} from "./api";

// WebAuthn base64url <-> ArrayBuffer yordamchilari
const b64urlToBytes = (value) => {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const binary = atob((value + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const bytesToB64url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export function isWebAuthnSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator?.credentials
  );
}

export async function isBiometricAvailable() {
  if (!isWebAuthnSupported()) return false;
  const checker = window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable;
  if (!checker) return false;
  try {
    return await checker.call(window.PublicKeyCredential);
  } catch {
    return false;
  }
}

export async function registerBiometricDevice() {
  const options = await getBiometricRegisterOptions();
  const publicKey = {
    ...options,
    challenge: b64urlToBytes(options.challenge),
    user: { ...options.user, id: b64urlToBytes(options.user.id) },
    excludeCredentials: (options.excludeCredentials || []).map((credential) => ({
      ...credential,
      id: b64urlToBytes(credential.id),
    })),
  };
  const created = await navigator.credentials.create({ publicKey });
  if (!created) throw new Error("Qurilma ro'yxatdan o'tmadi.");
  const transports =
    typeof created.response.getTransports === "function"
      ? created.response.getTransports()
      : [];
  return registerBiometricCredential({
    credential_id: bytesToB64url(created.rawId),
    client_data_json: bytesToB64url(created.response.clientDataJSON),
    attestation_object: bytesToB64url(created.response.attestationObject),
    transports,
  });
}

export async function authenticateWithBiometric() {
  const options = await getBiometricAuthOptions();
  const publicKey = {
    ...options,
    challenge: b64urlToBytes(options.challenge),
    allowCredentials: (options.allowCredentials || []).map((credential) => ({
      ...credential,
      id: b64urlToBytes(credential.id),
    })),
  };
  const assertion = await navigator.credentials.get({ publicKey });
  if (!assertion) throw new Error("Biometrik tasdiqlash amalga oshmadi.");
  return {
    credential_id: bytesToB64url(assertion.rawId),
    client_data_json: bytesToB64url(assertion.response.clientDataJSON),
    authenticator_data: bytesToB64url(assertion.response.authenticatorData),
    signature: bytesToB64url(assertion.response.signature),
  };
}

// Bitta biometrik tasdiqlash bir nechta ptichka uchun qayta ishlatiladi:
// brauzer dialogi 60 soniya ichida yana ochilmaydi.
const BIOMETRIC_REUSE_MS = 60000;
let cachedProof = { payload: null, at: 0 };

export async function getBiometricProof() {
  if (cachedProof.payload && Date.now() - cachedProof.at < BIOMETRIC_REUSE_MS) {
    return cachedProof.payload;
  }
  const payload = await authenticateWithBiometric();
  cachedProof = { payload, at: Date.now() };
  return payload;
}

export function clearBiometricProof() {
  cachedProof = { payload: null, at: 0 };
}

export function removeBiometricDevice(credentialId) {
  clearBiometricProof();
  return removeBiometricCredential(credentialId);
}

export function biometricErrorMessage(error) {
  const name = error?.name || "";
  if (name === "NotAllowedError") {
    return "Biometrik tasdiqlash bekor qilindi yoki vaqt tugadi.";
  }
  if (name === "InvalidStateError") {
    return "Bu qurilma allaqachon ulangan.";
  }
  if (name === "SecurityError") {
    return "Bu domen uchun biometrik tasdiqlash sozlanmagan.";
  }
  if (name === "NotSupportedError") {
    return "Qurilma biometrik tasdiqlashni qo'llab-quvvatlamaydi.";
  }
  return error?.message || "Biometrik tasdiqlash amalga oshmadi.";
}
