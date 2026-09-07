/* ============================================================
   M. Zapelini Studio

   PARA ADICIONAR UM DESENHO NOVO:
   1. salve a imagem em assets/ (jpg, largura de 1200px basta)
   2. copie um bloco do array OBRAS abaixo e ajuste os campos

   QUANDO UMA OBRA FOR VENDIDA:
   troque venda: true por venda: false. Ela continua na galeria,
   marcada como vendida, servindo de portfólio.
   ============================================================ */

const OBRAS = [
  {
    arquivo: "assets/coroa-de-espinhos.jpg",
    titulo:  "Coroa de Espinhos",
    tecnica: "lápis de cor e tinta sobre papel",
    categoria: "Retrato",
    alt: "Retrato em grafite de Cristo com a coroa de espinhos, feito sobre papel preto",
    venda: true
  },
  {
    arquivo: "assets/riso.jpg",
    titulo:  "Louisa Clark e Will Traynor",
    tecnica: "grafite sobre papel",
    categoria: "Retrato",
    alt: "Desenho a grafite de um casal rindo, retrato duplo",
    venda: true
  },
  {
    arquivo: "assets/janela.jpg",
    titulo:  "Janela ao Entardecer",
    tecnica: "lápis de cor sobre papel",
    categoria: "Cena",
    alt: "Silhueta de uma pessoa encostada numa janela contra um céu alaranjado, em lápis de cor",
    venda: true
  }
];

/* Mostra a barra de filtros só quando houver obras suficientes
   para ela fazer diferença. */
const MINIMO_PARA_FILTRAR = 5;

/* ------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------ */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   Topo: fundo sólido depois de rolar + menu mobile
   ------------------------------------------------------------ */
const topo = $("#topo");
const nav = $("#nav");
const hamburguer = $("#hamburguer");

const marcarTopo = () => topo.classList.toggle("encolhido", window.scrollY > 40);
marcarTopo();
addEventListener("scroll", marcarTopo, { passive: true });

hamburguer.addEventListener("click", () => {
  const aberto = nav.classList.toggle("aberto");
  hamburguer.setAttribute("aria-expanded", String(aberto));
  hamburguer.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  document.body.style.overflow = aberto ? "hidden" : "";
});

nav.addEventListener("click", e => {
  if (e.target.tagName !== "A" || !nav.classList.contains("aberto")) return;
  nav.classList.remove("aberto");
  hamburguer.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
});

/* ------------------------------------------------------------
   A luz da galeria: acompanha o cursor no hero
   ------------------------------------------------------------ */
const hero = $("#hero");
if (hero && !semMovimento && matchMedia("(pointer:fine)").matches) {
  // A classe libera o efeito de revelar texto; sem ponteiro fino ou com
  // movimento reduzido, os textos ficam legíveis do jeito normal.
  hero.classList.add("com-luz");

  let pendente = false, px = 50, py = 42, lx = 0, ly = 0;
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 100;
    py = ((e.clientY - r.top) / r.height) * 100;
    lx = e.clientX;  // relativo à janela: é assim que o fundo fixo é posicionado
    ly = e.clientY;
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => {
      hero.style.setProperty("--mx", px + "%");
      hero.style.setProperty("--my", py + "%");
      hero.style.setProperty("--lx", lx + "px");
      hero.style.setProperty("--ly", ly + "px");
      pendente = false;
    });
  });
}

/* ------------------------------------------------------------
   Revelação ao rolar
   ------------------------------------------------------------ */
const observador = new IntersectionObserver((entradas, obs) => {
  entradas.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("visivel");
    obs.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

const observarRevelaveis = () => $$(".reveal:not(.visivel)").forEach(el => observador.observe(el));

/* ------------------------------------------------------------
   Galeria
   ------------------------------------------------------------ */
const grade = $("#grade");
const filtros = $("#filtros");
let visiveis = OBRAS.slice();

function montarGrade(categoria = "Todos") {
  visiveis = categoria === "Todos"
    ? OBRAS.slice()
    : OBRAS.filter(o => o.categoria === categoria);

  grade.innerHTML = "";

  visiveis.forEach((obra, i) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "obra reveal" + (obra.venda ? "" : " obra--vendida");
    botao.dataset.indice = String(i);
    botao.setAttribute("aria-label", `Ampliar ${obra.titulo}`);
    botao.innerHTML = `
      <span class="obra__midia">
        <img src="${obra.arquivo}" alt="${obra.alt}" loading="lazy" decoding="async">
      </span>
      <span class="obra__legenda">
        ${obra.titulo}
        <small>${obra.tecnica}${obra.venda ? " · à venda" : " · vendido"}</small>
      </span>`;
    botao.addEventListener("click", () => abrirLightbox(i));
    grade.appendChild(botao);
  });

  // Colunas suficientes para as obras, sem deixar coluna vazia
  grade.style.setProperty("--colunas", String(Math.min(3, Math.max(1, Math.ceil(visiveis.length / 2)))));

  observarRevelaveis();
}

function montarFiltros() {
  if (OBRAS.length < MINIMO_PARA_FILTRAR) return;

  const categorias = ["Todos", ...new Set(OBRAS.map(o => o.categoria))];
  filtros.hidden = false;
  filtros.innerHTML = categorias.map((c, i) =>
    `<button type="button" class="filtro" aria-pressed="${i === 0}">${c}</button>`
  ).join("");

  filtros.addEventListener("click", e => {
    const alvo = e.target.closest(".filtro");
    if (!alvo) return;
    $$(".filtro", filtros).forEach(b => b.setAttribute("aria-pressed", String(b === alvo)));
    montarGrade(alvo.textContent.trim());
  });
}

/* ------------------------------------------------------------
   Lightbox
   ------------------------------------------------------------ */
const lightbox = $("#lightbox");
const lbMidia = $("#lbMidia");
const lbLegenda = $("#lbLegenda");
let indiceAtual = 0;
let focoAnterior = null;

function renderLightbox() {
  const obra = visiveis[indiceAtual];
  lbMidia.innerHTML = `<img src="${obra.arquivo}" alt="${obra.alt}">`;
  lbLegenda.innerHTML = `${obra.titulo}<small>${obra.tecnica}</small>`;
  const soUma = visiveis.length < 2;
  $("#lbAnt").hidden = soUma;
  $("#lbProx").hidden = soUma;
}

function abrirLightbox(i) {
  focoAnterior = document.activeElement;
  indiceAtual = i;
  renderLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  $("#lbFechar").focus();
}

function fecharLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
  if (focoAnterior) focoAnterior.focus();
}

const irPara = passo => {
  indiceAtual = (indiceAtual + passo + visiveis.length) % visiveis.length;
  renderLightbox();
};

$("#lbFechar").addEventListener("click", fecharLightbox);
$("#lbAnt").addEventListener("click", () => irPara(-1));
$("#lbProx").addEventListener("click", () => irPara(1));
lightbox.addEventListener("click", e => { if (e.target === lightbox) fecharLightbox(); });

addEventListener("keydown", e => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") fecharLightbox();
  if (e.key === "ArrowLeft") irPara(-1);
  if (e.key === "ArrowRight") irPara(1);
  if (e.key === "Tab") {
    const focaveis = $$("button:not([hidden])", lightbox);
    const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }
});

/* ------------------------------------------------------------
   Início
   ------------------------------------------------------------ */
montarFiltros();
montarGrade();
observarRevelaveis();
