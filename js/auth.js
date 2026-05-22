/* ============================================================
   PANCHO — auth.js
   Login, registro y Google OAuth.

   SEGURIDAD:
   - El GOOGLE_CLIENT_ID NUNCA está hardcodeado acá.
     El backend expone GET /api/auth/google/init que devuelve
     la URL de OAuth ya construida con el Client ID del .env.
   - El token de sesión se maneja via cookie HttpOnly (el backend
     la setea). NO usamos localStorage para tokens.
   - Todos los campos se validan también en el servidor.
     La validación acá es solo feedback de UX, no de seguridad.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── GOOGLE OAUTH ──
  // El frontend le pide al backend la URL — nunca expone el Client ID
  const btnGoogle = document.getElementById('btn-google-login')
                 || document.getElementById('btn-google-register');

  if (btnGoogle) {
    btnGoogle.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res  = await fetchWithTimeout('/api/auth/google/init', { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          showError('No se pudo iniciar el login con Google. Intentá de nuevo.');
        }
      } catch (err) {
        showError('Error de conexión. Intentá de nuevo.');
        console.error('[auth] Google init error:', err.message);
      }
    });
  }

  // ── LOGIN ──
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      // Validación UX básica (el servidor revalida todo)
      if (!email || !password) return showError('Completá todos los campos.');

      try {
        const res = await fetchWithTimeout('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // credentials: 'include' para que el backend pueda setear cookie HttpOnly
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        // Inspección estricta del código HTTP — nunca modo no-cors
        if (res.status === 429) return showError('Demasiados intentos. Esperá unos minutos.');
        if (res.status === 401) return showError('Email o contraseña incorrectos.');
        if (!res.ok)            return showError('Error al ingresar. Intentá de nuevo.');

        window.location.href = '/dashboard.html';

      } catch (err) {
        showError('Error de conexión. Intentá de nuevo.');
        console.error('[auth] Login error:', err.message);
      }
    });
  }

  // ── REGISTRO ──
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot — si el campo oculto tiene valor, es bot: fallar silenciosamente
      const hp = document.getElementById('hp_website');
      if (hp && hp.value !== '') {
        // Simular éxito para no revelar la detección
        window.location.href = '/dashboard.html';
        return;
      }

      const payload = {
        nombre:   document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        empresa:  document.getElementById('empresa').value.trim(),
        email:    document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      };

      // Validación UX básica
      if (!payload.nombre || !payload.apellido || !payload.empresa || !payload.email || !payload.password) {
        return showError('Completá todos los campos.');
      }

      try {
        const res = await fetchWithTimeout('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (res.status === 429) return showError('Demasiadas solicitudes. Intentá más tarde.');
        if (res.status === 409) return showError('Ese email ya está registrado.');
        if (!res.ok)            return showError('Error al registrarse. Intentá de nuevo.');

        window.location.href = '/dashboard.html';

      } catch (err) {
        showError('Error de conexión. Intentá de nuevo.');
        console.error('[auth] Register error:', err.message);
      }
    });
  }

  // ── INDICADOR FUERZA CONTRASEÑA ──
  const pwInput = document.getElementById('password');
  if (pwInput && document.getElementById('bar1')) {
    pwInput.addEventListener('input', () => checkStrength(pwInput.value));
  }

});

// ── HELPERS ──

/**
 * fetch con timeout de 8s (AbortController)
 * Evita que peticiones colgadas bloqueen al usuario
 */
async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Muestra un mensaje de error en el form
 * Usa un elemento #form-error si existe, sino alert como fallback
 */
function showError(msg) {
  const el = document.getElementById('form-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  } else {
    alert(msg);
  }
}

/**
 * Indicador visual de fuerza de contraseña
 * Solo UX — la validación real es server-side
 */
function checkStrength(val) {
  const bars  = [
    document.getElementById('bar1'),
    document.getElementById('bar2'),
    document.getElementById('bar3')
  ];
  const label = document.getElementById('strength-label');
  if (!bars[0] || !label) return;

  bars.forEach(b => { b.className = 'strength-bar'; });
  if (val.length === 0) { label.textContent = ''; return; }

  let score = 0;
  if (val.length >= 8)                          score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val))  score++;
  if (/[^A-Za-z0-9]/.test(val))                score++;

  const levels = ['weak', 'medium', 'strong'];
  const labels = ['Débil', 'Media', 'Fuerte'];
  for (let i = 0; i < score; i++) bars[i].classList.add(`active-${levels[score - 1]}`);
  label.textContent = labels[score - 1] || '';
}
