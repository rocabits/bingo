const $ = (id) => document.getElementById(id);

const $numero = $('numeroActual');
const $restantes = $('bolasRestantes');
const $historial = $('historialLista');
const $estado = $('estado');
const $btnIniciar = $('btnIniciar');
const $btnPausar = $('btnPausar');
const $btnReiniciar = $('btnReiniciar');
const $btnMute = $('btnMute');
const $toast = $('toast');

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

function barajar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function mostrarToast(texto) {
  $toast.textContent = texto;
  $toast.classList.add('show');
  clearTimeout($toast._t);
  $toast._t = setTimeout(() => $toast.classList.remove('show'), 2500);
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

$btnIniciar.addEventListener('click', iniciarJuego);
$btnPausar.addEventListener('click', pausarJuego);
$btnReiniciar.addEventListener('click', reiniciarJuego);
$btnMute.addEventListener('click', alternarMute);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

inicializar();
