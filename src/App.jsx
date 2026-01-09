// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiPost } from "./api";
import { initGoogleSignIn, renderGoogleButton, revokeAccount } from "./auth";

export default function App() {
  const [idToken, setIdToken] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amounts, setAmounts] = useState({});    // serviceId -> montant
  const [filledAt, setFilledAt] = useState({});  // serviceId -> timestamp ms
  const [error, setError] = useState("");

  useEffect(() => {
    if (!window.google?.accounts?.id) return;

    initGoogleSignIn({
      onCredential: (jwt) => {
        setIdToken(jwt);
      },
    });
    renderGoogleButton("gbtn");
  }, []);

  async function loadContext() {
    if (!idToken) return;
    setLoading(true); setError("");
    try {
      const data = await apiPost({ action: "getContext", id_token: idToken });
      setCtx(data);
      if (data?.authorized) {
        // init montants à 0 (option) mais on exige saisie => tu peux laisser vide si tu veux
        const init = {};
        data.services.forEach(s => { init[s.serviceId] = 0; });
        setAmounts(init);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadContext(); }, [idToken]);

  const services = useMemo(() => ctx?.services || [], [ctx]);

  function onAmountChange(serviceId, value) {
    const n = value === "" ? "" : Number(value);
    setAmounts(a => ({ ...a, [serviceId]: n }));
    setFilledAt(f => ({ ...f, [serviceId]: Date.now() })); // ordre réel
  }

  async function onSubmit() {
    setError("");
    if (!ctx?.authorized) return;

    // validation montants >=0 et pas vide
    for (const s of services) {
      const v = amounts[s.serviceId];
      if (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) || Number(v) < 0) {
        setError(`Montant invalide pour: ${s.nomService}`);
        return;
      }
      if (!filledAt[s.serviceId]) {
        setError(`Veuillez renseigner (modifier) le champ pour: ${s.nomService}`);
        return;
      }
    }

    const items = services.map(s => ({
      serviceId: s.serviceId,
      montant: Number(amounts[s.serviceId]),
      filledAt: filledAt[s.serviceId],
    }));

    setLoading(true);
    try {
      const out = await apiPost({ action: "submit", id_token: idToken, items });
      if (!out.ok) setError(out.error || "Erreur");
      else {
        // reset ordre + feedback
        setFilledAt({});
        alert(`Enregistré: ${out.saved} ligne(s) - ${out.dateUtc} ${out.timeUtc} UTC`);
        // reload context si besoin
        await loadContext();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onChangeAccount() {
    // si pas d'email connu, on reset juste l'état
    const email = ctx?.email;
    setIdToken(null);
    setCtx(null);
    setAmounts({});
    setFilledAt({});
    if (email) {
      revokeAccount(email, () => {
        // l’utilisateur reclique sur le bouton Google
      });
    }
  }

  if (!idToken) {
    return (
      <div style={styles.page}>
        <h2>Connexion</h2>
        <div id="gbtn" />
        <p style={styles.hint}>Connecte-toi avec ton compte Google.</p>
      </div>
    );
  }

  if (loading && !ctx) {
    return <div style={styles.page}>Chargement...</div>;
  }

  if (ctx && ctx.authorized === false) {
    return (
      <div style={styles.page}>
        <h2>Accès refusé</h2>
        <p>Vous n’êtes pas autorisé. Veuillez changer de compte.</p>
        <div style={styles.row}>
          <button onClick={onChangeAccount}>Changer de compte</button>
          <button onClick={loadContext}>Rafraîchir</button>
        </div>
        {error && <p style={styles.err}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>POINT JOURNALIERE</h2>
        <p style={styles.sub}>Renseignez les montants pour chaque service</p>

        <div style={styles.metaGrid}>
          <div style={styles.metaBox}><b>Date (UTC)</b><div>{new Date().toISOString().slice(0,10)}</div></div>
          <div style={styles.metaBox}><b>Heure (UTC)</b><div>{new Date().toISOString().slice(11,19)}</div></div>
          <div style={styles.metaBox}><b>Centre</b><div>{ctx?.centreName}</div></div>
          <div style={styles.metaBox}><b>Email</b><div>{ctx?.email}</div></div>
        </div>

        <div style={styles.banner}>
          Connecté en tant que <b>{ctx?.nomUtilisateur}</b>
          <span style={{ marginLeft: "auto" }}>{services.length} services</span>
        </div>

        <div style={styles.row}>
          <button onClick={loadContext}>Rafraîchir</button>
          <button onClick={onChangeAccount}>Changer de compte</button>
        </div>

        {error && <p style={styles.err}>{error}</p>}
      </div>

      <div style={styles.list}>
        {services.map((s) => (
          <div key={s.serviceId} style={styles.item}>
            <div style={{ fontWeight: 600 }}>{s.nomService}</div>
            <input
              type="number"
              min="0"
              step="1"
              value={amounts[s.serviceId] ?? ""}
              onChange={(e) => onAmountChange(s.serviceId, e.target.value)}
              style={styles.input}
              required
            />
          </div>
        ))}
      </div>

      <button onClick={onSubmit} style={styles.submit}>
        Soumettre ({services.length} services)
      </button>
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" },
  header: { position: "sticky", top: 0, background: "#fff", paddingBottom: 12, zIndex: 2 },
  sub: { marginTop: 6, color: "#666" },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 10 },
  metaBox: { border: "1px solid #eee", borderRadius: 10, padding: 10, background: "#fafafa" },
  banner: { display: "flex", gap: 10, alignItems: "center", border: "1px solid #e6f0ff", background: "#f5f9ff", padding: 10, borderRadius: 10, marginTop: 10 },
  row: { display: "flex", gap: 10, marginTop: 10 },
  list: { marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10 },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, border: "1px solid #eee", borderRadius: 12, marginBottom: 10 },
  input: { width: 140, padding: 10, borderRadius: 10, border: "1px solid #ddd", textAlign: "right" },
  submit: { width: "100%", marginTop: 12, padding: 14, borderRadius: 12, border: "none", background: "#0b63f6", color: "white", fontSize: 16, fontWeight: 700 },
  err: { color: "#b00020" },
  hint: { color: "#666" },
};
