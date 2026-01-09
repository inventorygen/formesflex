// src/auth.js
import { GOOGLE_CLIENT_ID } from "./config";

export function initGoogleSignIn({ onCredential }) {
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resp) => onCredential(resp.credential), // resp.credential = ID token (JWT)
    auto_select: false,
    cancel_on_tap_outside: false,
  });
}

export function renderGoogleButton(containerId) {
  window.google.accounts.id.renderButton(
    document.getElementById(containerId),
    { theme: "outline", size: "large", width: 260 }
  );
}

export function revokeAccount(email, cb) {
  // Revoke officiel Google [Source](https://developers.google.com/identity/gsi/web/guides/revoke)
  window.google.accounts.id.revoke(email, () => cb?.());
}
