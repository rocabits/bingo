// ========== CONSTANTS ==========
var APP_ID = 'bingo';
var ADMIN_EMAIL = 'roca.jlr@gmail.com';

// ========== SUPABASE STATE ==========
var supabaseClient = null;
var currentUserEmail = null;

// ========== BINGO STATE ==========
const $ = (id) => document.getElementById(id);

const $numero = $('numeroActual');
const $restantes = $('bolasRestantes');
const $historial = $('historialLista');
const $estado = $('estado');
const $btnIniciar = $('btnIniciar');
const $btnPausar = $('btnPausar');
const $btnReiniciar = $('btnReiniciar');
const $btnMute = $('btnMute');

let disponibles = [];
let historial = [];
let numeroActual = null;
let isPlaying = false;
let intervaloId = null;
let juegoTerminado = false;
let muteado = false;

const FRASES = {
  1: 'El gallo',
  2: 'La niña bonita',
  3: 'La cebra',
  5: 'La mano del diablo',
  7: 'El revólver',
  11: 'Las piernas de la mujer',
  22: 'Los patitos',
  69: 'La pregunta incómoda',
  90: 'El abuelo'
};

// ========== BINGO FUNCTIONS ==========
function barajar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function inicializar() {
  if (intervaloId) {
    clearInterval(intervaloId);
    intervaloId = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  disponibles = Array.from({ length: 90 }, (_, i) => i + 1);
  barajar(disponibles);
  historial = [];
  numeroActual = null;
  isPlaying = false;
  juegoTerminado = false;
  actualizarUI();
}

function actualizarUI() {
  $restantes.textContent = `${disponibles.length} restantes`;

  if (juegoTerminado) {
    $numero.textContent = 'BINGO!';
    $numero.style.fontSize = '5rem';
    $numero.classList.remove('destacado');
    $btnIniciar.disabled = true;
    $btnPausar.disabled = true;
    $estado.textContent = 'BINGO!';
    $estado.className = 'estado bingo';
    return;
  }

  const hayNumero = numeroActual !== null;
  $numero.textContent = hayNumero ? numeroActual : '--';
  $numero.style.fontSize = '';
  $numero.classList.toggle('destacado', hayNumero);
  $btnIniciar.disabled = isPlaying;
  $btnPausar.disabled = !isPlaying;

  $historial.innerHTML = historial.map(n => `<span class="bola-historial">${n}</span>`).join('');

  if (isPlaying) {
    $estado.textContent = 'Jugando';
    $estado.className = 'estado jugando';
  } else {
    $estado.textContent = 'Pausado';
    $estado.className = 'estado pausado';
  }
}

function animarNumero() {
  $numero.classList.remove('pop');
  void $numero.offsetWidth;
  $numero.classList.add('pop');
}

function sacarBola() {
  if (disponibles.length === 0) {
    if (intervaloId) {
      clearInterval(intervaloId);
      intervaloId = null;
    }
    isPlaying = false;
    juegoTerminado = true;
    actualizarUI();
    mostrarToast('BINGO!');
    return;
  }

  const numero = disponibles.pop();
  numeroActual = numero;
  historial.push(numero);
  if (!muteado) hablarNumero(numero);
  actualizarUI();
  animarNumero();
  $historial.scrollTop = $historial.scrollHeight;
}

function hablarNumero(numero) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const frase = FRASES[numero];
  const texto = frase ? `Número ${numero}... ${frase}` : `Número ${numero}`;

  const ut = new SpeechSynthesisUtterance(texto);
  ut.lang = 'es-ES';
  ut.rate = 0.85;
  ut.pitch = 1.0 + (numero % 5) * 0.05;
  window.speechSynthesis.speak(ut);
}

function alternarMute() {
  muteado = !muteado;
  $btnMute.textContent = muteado ? '🔇' : '🔊';
  $btnMute.classList.toggle('muted', muteado);
  if ('speechSynthesis' in window && muteado) window.speechSynthesis.cancel();
  mostrarToast(muteado ? 'Voz desactivada' : 'Voz activada');
}

function iniciarJuego() {
  if (isPlaying || juegoTerminado) return;

  isPlaying = true;
  actualizarUI();
  sacarBola();
  intervaloId = setInterval(sacarBola, 5000);
  mostrarToast('Juego iniciado');
}

function pausarJuego() {
  if (!isPlaying) return;

  clearInterval(intervaloId);
  intervaloId = null;
  isPlaying = false;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  actualizarUI();
  mostrarToast('Juego pausado');
}

function reiniciarJuego() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  inicializar();
  mostrarToast('Juego reiniciado');
}

function mostrarToast(texto) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = texto;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(function () { t.classList.remove('show'); }, 2500);
}

// ========== SUPABASE ==========
function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

function handleGoogleLogin() {
  if (!supabaseClient) return;
  var btn = document.getElementById('btnGoogleLogin');
  btn.disabled = true;
  btn.innerHTML =
    '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/></svg>' +
    ' Iniciando sesi\u00F3n\u2026';
  supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });
}

function checkSession() {
  if (!supabaseClient) return Promise.resolve(null);
  return supabaseClient.auth.getSession().then(function (result) {
    var session = result.data ? result.data.session : null;
    if (!session) return null;
    return supabaseClient.from('allowed_emails')
      .select('email').in('app_id', [APP_ID, 'all'])
      .eq('email', session.user.email).maybeSingle()
      .then(function (res) {
        if (res.data) {
          currentUserEmail = session.user.email;
          return session.user.email;
        }
        supabaseClient.auth.signOut();
        mostrarToast('No tienes permiso para acceder');
        return null;
      }).catch(function () {
        currentUserEmail = session.user.email;
        return session.user.email;
      });
  }).catch(function () { return null; });
}

// ========== AUTH UI ==========
function showLogin() {
  document.getElementById('viewLogin').classList.remove('hidden');
  document.getElementById('viewApp').classList.add('hidden');
  document.getElementById('fabAdd').style.display = 'none';
}

function hideLogin() {
  document.getElementById('viewLogin').classList.add('hidden');
  document.getElementById('viewApp').classList.remove('hidden');
}

// ========== VIEWS ==========
function hideAllViews() {
  document.getElementById('viewUsuarios').classList.remove('active');
}

// ========== ADMIN: USER MANAGEMENT ==========
function showUsuarios() {
  hideAllViews();
  document.querySelector('.bingo-game').classList.add('hidden');
  document.getElementById('viewUsuarios').classList.add('active');
  document.getElementById('fabAdd').style.display = '';
  document.getElementById('btnBack').classList.add('visible');
  renderUsuarios();
}

function hideUsuarios() {
  document.querySelector('.bingo-game').classList.remove('hidden');
  document.getElementById('viewUsuarios').classList.remove('active');
  document.getElementById('btnBack').classList.remove('visible');
  document.getElementById('headerTitle').textContent = 'BINGO';
  document.getElementById('fabAdd').style.display = 'none';
}

function renderUsuarios() {
  if (!supabaseClient) return;
  supabaseClient.from('allowed_emails').select('email').eq('app_id', APP_ID).then(function (res) {
    var total = res.data ? res.data.length : 0;
    document.getElementById('headerTitle').textContent = 'BINGO: Usuarios (' + total + ')';
    var html = '';
    if (res.data) {
      var filtered = res.data.filter(function (r) { return r.email !== currentUserEmail; });
      for (var i = 0; i < filtered.length; i++) {
        html +=
          '<div class="player-card" style="cursor:default">' +
          '<div class="player-info"><div class="player-name" style="font-size:14px;text-transform:none">' + escapeHtml(filtered[i].email) + '</div></div>' +
          '<button class="btn-edit" data-email="' + escapeHtml(filtered[i].email) + '" aria-label="Editar usuario">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
          '</button>' +
          '<button class="btn-delete" data-email="' + escapeHtml(filtered[i].email) + '" aria-label="Eliminar usuario">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>' +
          '</button></div>';
      }
    }
    document.getElementById('usuariosList').innerHTML =
      html ||
      '<div class="empty-state"><p class="empty-title">No hay usuarios</p><p class="empty-sub">A\u00F1ade el primer email</p></div>';
  });
}

function openUsuarioModal(email) {
  document.getElementById('inviteEmail').value = email || '';
  document.getElementById('editUsuarioEmail').value = email || '';
  document.getElementById('usuarioModalTitle').textContent = email ? 'Editar usuario' : 'Nuevo usuario';
  document.getElementById('modalUsuario').classList.add('open');
  setTimeout(function () { document.getElementById('inviteEmail').focus(); }, 350);
}

function closeUsuarioModal() {
  document.getElementById('modalUsuario').classList.remove('open');
  document.getElementById('editUsuarioEmail').value = '';
}

function saveUsuario() {
  var input = document.getElementById('inviteEmail');
  var email = input.value.trim();
  if (!email || email.indexOf('@') === -1) {
    mostrarToast('Email no v\u00E1lido');
    return;
  }
  if (!supabaseClient) return;
  var oldEmail = document.getElementById('editUsuarioEmail').value;
  var doInsert = function () {
    supabaseClient.from('allowed_emails').insert({ app_id: APP_ID, email: email }).then(function (res) {
      if (res.error) {
        mostrarToast('Error al guardar: ' + res.error.message);
      } else {
        closeUsuarioModal();
        renderUsuarios();
        mostrarToast(oldEmail ? 'Usuario actualizado' : 'Usuario a\u00F1adido');
      }
    });
  };
  if (oldEmail && oldEmail !== email) {
    supabaseClient.from('allowed_emails').delete().eq('app_id', APP_ID).eq('email', oldEmail).then(function (res) {
      if (res.error) {
        mostrarToast('Error al actualizar');
      } else {
        doInsert();
      }
    });
  } else {
    doInsert();
  }
}

function removeUsuario(email) {
  showConfirm('\u00BF Eliminar a ' + email + '?', function () {
    supabaseClient.from('allowed_emails').delete().eq('app_id', APP_ID).eq('email', email).then(function (res) {
      if (res.error) {
        mostrarToast('Error al eliminar');
      } else {
        renderUsuarios();
        mostrarToast('Usuario eliminado');
      }
    });
  });
}

function logout() {
  if (supabaseClient) {
    supabaseClient.auth.signOut();
  }
  currentUserEmail = null;
  hideUsuarios();
  document.getElementById('fabAdd').style.display = 'none';
  showLogin();
}

// ========== CONFIRM ==========
var confirmCallback = null;

function showConfirm(message, onConfirm, buttonText) {
  confirmCallback = onConfirm;
  document.getElementById('confirmText').textContent = message;
  document.getElementById('btnConfirmOk').textContent = buttonText || 'Eliminar';
  if (buttonText === 'Crear') {
    document.getElementById('confirmIcon').innerHTML =
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  } else {
    document.getElementById('confirmIcon').innerHTML =
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  }
  document.getElementById('modalConfirm').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  confirmCallback = null;
  document.getElementById('modalConfirm').classList.remove('open');
  document.body.style.overflow = '';
}

// ========== HELPERS ==========
function escapeHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// ========== INIT ==========
function init() {
  initSupabase();
  document.getElementById('fabAdd').style.display = 'none';

  checkSession().then(function (email) {
    if (email) {
      currentUserEmail = email;
      hideLogin();
      inicializar();
      document.getElementById('fabAdd').style.display = 'none';

      // Bingo button events
      $btnIniciar.addEventListener('click', iniciarJuego);
      $btnPausar.addEventListener('click', pausarJuego);
      $btnReiniciar.addEventListener('click', reiniciarJuego);
      $btnMute.addEventListener('click', alternarMute);

      // FAB
      document.getElementById('fabAdd').addEventListener('click', function () {
        if (document.getElementById('viewUsuarios').classList.contains('active')) {
          openUsuarioModal();
        } else {
          mostrarToast('Bingo - 90 bolas');
        }
      });

      // Back button
      document.getElementById('btnBack').addEventListener('click', function () {
        if (document.getElementById('viewUsuarios').classList.contains('active')) {
          hideUsuarios();
        }
      });

      // Logo - admin access
      document.getElementById('btnLogo').addEventListener('click', function () {
        if (email !== ADMIN_EMAIL) return;
        if (document.getElementById('viewUsuarios').classList.contains('active')) {
          hideUsuarios();
        } else {
          showUsuarios();
        }
      });

      // User modal
      document.getElementById('modalUsuarioClose').addEventListener('click', closeUsuarioModal);
      document.getElementById('modalUsuarioOverlay').addEventListener('click', closeUsuarioModal);
      document.getElementById('usuariosList').addEventListener('click', function (e) {
        if (e.target.closest('.btn-delete')) {
          removeUsuario(e.target.closest('.btn-delete').dataset.email);
        } else if (e.target.closest('.btn-edit')) {
          openUsuarioModal(e.target.closest('.btn-edit').dataset.email);
        }
      });
      document.getElementById('usuarioForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveUsuario();
      });

      // Confirm modal
      document.getElementById('btnConfirmOk').addEventListener('click', function () {
        if (confirmCallback) confirmCallback();
        closeConfirm();
      });
      document.getElementById('btnConfirmCancel').addEventListener('click', closeConfirm);
      document.getElementById('modalConfirmOverlay').addEventListener('click', closeConfirm);
    } else {
      showLogin();
      document.getElementById('btnGoogleLogin').addEventListener('click', handleGoogleLogin);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
