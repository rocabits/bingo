const $ = (id) => document.getElementById(id);

const $numero = $('numeroActual');
const $restantes = $('bolasRestantes');
const $historial = $('historialLista');
const $estado = $('estado');
const $btnIniciar = $('btnIniciar');
const $btnPausar = $('btnPausar');
const $btnReiniciar = $('btnReiniciar');

let disponibles = [];
let historial = [];
let numeroActual = null;
let isPlaying = false;
let intervaloId = null;
let juegoTerminado = false;

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
  $restantes.textContent = `Bolas restantes: ${disponibles.length}`;

  if (juegoTerminado) {
    $numero.textContent = 'BINGO!';
    $numero.style.fontSize = '5rem';
    $btnIniciar.disabled = true;
    $btnPausar.disabled = true;
    $estado.textContent = 'BINGO!';
    $estado.className = 'estado bingo';
    return;
  }

  $numero.textContent = numeroActual ?? '--';
  $numero.style.fontSize = '';
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

function sacarBola() {
  if (disponibles.length === 0) {
    if (intervaloId) {
      clearInterval(intervaloId);
      intervaloId = null;
    }
    isPlaying = false;
    juegoTerminado = true;
    actualizarUI();
    return;
  }

  const numero = disponibles.pop();
  numeroActual = numero;
  historial.push(numero);
  hablarNumero(numero);
  actualizarUI();
}

function hablarNumero(numero) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const mensaje = new SpeechSynthesisUtterance(`Número ${numero}`);
  mensaje.lang = 'es-ES';
  mensaje.rate = 0.85;
  mensaje.pitch = 1;
  window.speechSynthesis.speak(mensaje);
}

function iniciarJuego() {
  if (isPlaying || juegoTerminado) return;

  isPlaying = true;
  actualizarUI();
  sacarBola();
  intervaloId = setInterval(sacarBola, 5000);
}

function pausarJuego() {
  if (!isPlaying) return;

  clearInterval(intervaloId);
  intervaloId = null;
  isPlaying = false;
  actualizarUI();
}

function reiniciarJuego() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  inicializar();
}

$btnIniciar.addEventListener('click', iniciarJuego);
$btnPausar.addEventListener('click', pausarJuego);
$btnReiniciar.addEventListener('click', reiniciarJuego);

inicializar();
