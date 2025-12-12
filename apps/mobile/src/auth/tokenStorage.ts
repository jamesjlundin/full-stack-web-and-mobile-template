// In-memory token storage for React Native
// TODO: Replace with secure storage (Keychain/Keystore) for production

let storedToken: string | null = null;

export async function getToken() {
  return storedToken;
}

export async function setToken(token: string) {
  storedToken = token;
}

export async function clearToken() {
  storedToken = null;
}

