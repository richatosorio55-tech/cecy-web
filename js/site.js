/* =========================================================
   JS DEL SITIO - CECY
   1) Fallback elegante para imágenes rotas / pendientes
   2) Buscador y filtros de la página de Personal
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  /* ---------------------------------------------------------
     1) FALLBACK DE IMÁGENES
     Si una imagen no carga (foto todavía no subida o archivo
     dañado), la reemplazamos por un ícono institucional con
     las iniciales del nombre, en vez de mostrar el ícono roto
     del navegador. No inventa ni reemplaza fotos reales: solo
     actúa cuando la imagen realmente falla al cargar.
  --------------------------------------------------------- */

  function iniciales(texto) {
    return texto
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (palabra) { return palabra.charAt(0).toUpperCase(); })
      .join("");
  }

  function aplicarFallback(img) {

    if (img.dataset.fallbackAplicado === "1") return;
    img.dataset.fallbackAplicado = "1";

    var tarjetaNombre = img.closest(".card-persona, .card-equipo");
    var titulo = tarjetaNombre ? tarjetaNombre.querySelector("h5") : null;

    var etiqueta = img.getAttribute("alt") ||
                   (titulo ? titulo.textContent : "") ||
                   "CECY";

    var inic = iniciales(etiqueta) || "🏫";

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#1b5e20"/>' +
      '<stop offset="100%" stop-color="#66bb6a"/>' +
      '</linearGradient></defs>' +
      '<rect width="200" height="200" fill="url(#g)"/>' +
      '<text x="50%" y="53%" font-family="Arial, Helvetica, sans-serif" ' +
      'font-size="64" fill="#ffffff" text-anchor="middle" ' +
      'dominant-baseline="middle" font-weight="bold">' + inic + '</text>' +
      '</svg>';

    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    img.classList.add("img-pendiente");
  }

  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () { aplicarFallback(img); });
  });

  /* ---------------------------------------------------------
     2) BUSCADOR DE PERSONAL (solo corre si existe en la página)
  --------------------------------------------------------- */

  var inputTexto   = document.getElementById("buscador-texto");
  var selectCat     = document.getElementById("filtro-categoria");
  var btnLimpiar    = document.getElementById("btn-limpiar");
  var contador      = document.getElementById("contador-resultados");
  var sinResultados = document.getElementById("sin-resultados");
  var grid          = document.getElementById("grid-personal");

  if (inputTexto && grid) {

    var personas = Array.prototype.slice.call(grid.querySelectorAll(".persona"));
    var total = personas.length;

    function filtrar() {

      var texto = inputTexto.value.trim().toLowerCase();
      var categoria = selectCat ? selectCat.value : "todos";
      var visibles = 0;

      personas.forEach(function (persona) {

        var nombre = persona.dataset.nombre || "";
        var cargo = persona.dataset.cargo || "";

        var coincideTexto = !texto ||
          nombre.indexOf(texto) !== -1 ||
          cargo.indexOf(texto) !== -1;

        var coincideCategoria = categoria === "todos" ||
          persona.dataset.categoria === categoria;

        var mostrar = coincideTexto && coincideCategoria;

        persona.style.display = mostrar ? "" : "none";

        if (mostrar) visibles++;

      });

      if (contador) {
        contador.textContent = "Mostrando " + visibles + " de " + total + " integrantes";
      }

      if (sinResultados) {
        sinResultados.hidden = visibles !== 0;
      }

      grid.hidden = visibles === 0;

      // ocultar los grupos que quedaron sin integrantes visibles
      Array.prototype.forEach.call(grid.querySelectorAll(".grupo-personal"), function (g) {
        var hay = Array.prototype.some.call(g.querySelectorAll(".persona"), function (p) {
          return p.style.display !== "none";
        });
        g.style.display = hay ? "" : "none";
      });
    }

    inputTexto.addEventListener("input", filtrar);

    if (selectCat) {
      selectCat.addEventListener("change", filtrar);
    }

    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", function () {
        inputTexto.value = "";
        if (selectCat) selectCat.value = "todos";
        filtrar();
        inputTexto.focus();
      });
    }

    filtrar();
  }

  /* ---------------------------------------------------------
     3) MODAL DE CURRICULUM (solo corre si existe en la página)
  --------------------------------------------------------- */

  var modalEl = document.getElementById("modalCurriculum");

  if (modalEl && window.bootstrap) {

    var modal = new bootstrap.Modal(modalEl);
    var elFoto = document.getElementById("modalCurriculumFoto");
    var elNombre = document.getElementById("modalCurriculumNombre");
    var elCargo = document.getElementById("modalCurriculumCargo");
    var elTexto = document.getElementById("modalCurriculumTexto");

    document.querySelectorAll(".btn-curriculum").forEach(function (boton) {

      boton.addEventListener("click", function () {

        var tarjeta = boton.closest(".persona");
        if (!tarjeta) return;

        var img = tarjeta.querySelector(".img-persona");
        var nombre = tarjeta.querySelector("h5") ? tarjeta.querySelector("h5").textContent.trim() : "";
        var cargo = tarjeta.querySelector(".cargo") ? tarjeta.querySelector(".cargo").textContent.trim() : "";
        var curriculum = (tarjeta.dataset.curriculum || "").trim();

        elFoto.innerHTML = img ? img.outerHTML.replace("img-persona", "img-persona img-curriculum") : "";
        elNombre.textContent = nombre;
        elCargo.textContent = cargo;
        elTexto.textContent = curriculum ||
          "El currículum de " + nombre + " todavía no fue cargado. Muy pronto vas a poder ver su formación y trayectoria acá.";

        modal.show();

      });

    });

  }

});

/* =========================================================
   GALERÍA DE FOTOS DE CADA NIVEL (página Niveles)
   Pasa sola cada pocos segundos, se detiene al pasar el
   mouse y no depende de ninguna librería externa.
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {
  var reducir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-galeria]").forEach(function (g, gi) {
    var fotos = [].slice.call(g.querySelectorAll(".nivel-foto"));
    var puntos = g.querySelector(".nivel-dots");
    var actual = 0, timer = null;
    if (fotos.length < 2) { g.setAttribute("data-una", ""); return; }
    fotos.forEach(function (_, k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "nivel-dot";
      b.setAttribute("aria-label", "Ir a la foto " + (k + 1));
      b.addEventListener("click", function () { mostrar(k); reiniciar(); });
      puntos.appendChild(b);
    });
    function mostrar(n) {
      actual = (n + fotos.length) % fotos.length;
      fotos.forEach(function (f, k) { f.classList.toggle("is-active", k === actual); });
      [].forEach.call(puntos.children, function (d, k) { d.classList.toggle("is-active", k === actual); });
    }
    function auto() {
      if (reducir) return;
      clearInterval(timer);
      timer = setInterval(function () { mostrar(actual + 1); }, 4500 + gi * 250);
    }
    function reiniciar() { clearInterval(timer); auto(); }
    g.querySelector(".nivel-prev").addEventListener("click", function () { mostrar(actual - 1); reiniciar(); });
    g.querySelector(".nivel-next").addEventListener("click", function () { mostrar(actual + 1); reiniciar(); });
    g.addEventListener("mouseenter", function () { clearInterval(timer); });
    g.addEventListener("mouseleave", auto);
    mostrar(0); auto();
  });
});
