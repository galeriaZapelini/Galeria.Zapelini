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

const marcarTopo = () => topo.classList.toggle("encolhido", window.scrollY > 40);
marcarTopo();
addEventListener("scroll", marcarTopo, { passive: true });

/* A gaveta do menu é o offcanvas do Bootstrap: foco preso, Esc, backdrop e
   trava de rolagem vêm de lá. Aqui só trocamos o rótulo do botão. */
const menu = $("#menu");
const hamburguer = $("#hamburguer");
if (menu && hamburguer) {
  menu.addEventListener("show.bs.offcanvas", () => hamburguer.setAttribute("aria-label", "Fechar menu"));
  menu.addEventListener("hide.bs.offcanvas", () => hamburguer.setAttribute("aria-label", "Abrir menu"));
}

/* Links do menu que apontam para âncoras da própria página: enquanto a gaveta
   (offcanvas) está aberta, o Bootstrap trava a rolagem do body até ela terminar
   de fechar, então o salto para a âncora se perde nesse meio-tempo. Por isso a
   rolagem só acontece depois que o offcanvas termina de fechar. */
if (menu) {
  $$('a[href^="#"]', menu).forEach(link => {
    link.addEventListener("click", e => {
      const alvo = $(link.getAttribute("href"));
      if (!alvo) return;
      e.preventDefault();

      const rolar = () => alvo.scrollIntoView({ behavior: semMovimento ? "auto" : "smooth", block: "start" });

      if (menu.classList.contains("show")) {
        menu.addEventListener("hidden.bs.offcanvas", rolar, { once: true });
      } else {
        rolar();
      }
    });
  });
}

/* ------------------------------------------------------------
   A luz da galeria: acompanha o cursor no hero
   ------------------------------------------------------------ */
const hero = $("#hero");
const ponteiroFino = matchMedia("(pointer:fine)").matches;

if (hero && !semMovimento) {
  let pendente = false;

  // Recebe a posição da luz em coordenadas da janela e alimenta as duas
  // formas que o CSS usa: porcentagem dentro do hero (o facho e a grade)
  // e pixels da janela (o recorte de texto, que usa fundo fixo).
  const aplicar = (x, y) => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((x - r.left) / r.width) * 100 + "%");
      hero.style.setProperty("--my", ((y - r.top) / r.height) * 100 + "%");
      hero.style.setProperty("--lx", x + "px");
      hero.style.setProperty("--ly", y + "px");
      pendente = false;
    });
  };

  if (ponteiroFino) {
    // Mouse: a luz é o cursor, e só aqui o texto do rodapé é recortado nela.
    hero.classList.add("com-luz");
    hero.addEventListener("pointermove", e => aplicar(e.clientX, e.clientY));

  } else {
    // Toque: ninguém aponta o facho, então ele caminha sozinho pela parede,
    // devagar, como alguém atravessando a sala com uma lanterna. O dedo assume
    // o comando enquanto está na tela.
    let t = Math.random() * 100, alvoX = 0, alvoY = 0, atualX = 0, atualY = 0;
    let conduzindo = false, rodando = false, quadro = 0, iniciado = false;

    const passo = () => {
      const r = hero.getBoundingClientRect();
      if (!conduzindo) {
        t += 0.005;
        alvoX = r.left + r.width  * (0.5 + 0.3 * Math.sin(t));
        alvoY = r.top  + r.height * (0.46 + 0.24 * Math.sin(t * 1.7));
      }
      if (!iniciado) { atualX = alvoX; atualY = alvoY; iniciado = true; }
      atualX += (alvoX - atualX) * 0.07;
      atualY += (alvoY - atualY) * 0.07;
      aplicar(atualX, atualY);
      quadro = requestAnimationFrame(passo);
    };

    const ligar  = () => { if (!rodando) { rodando = true; quadro = requestAnimationFrame(passo); } };
    const parar  = () => { rodando = false; cancelAnimationFrame(quadro); };

    // Fora da tela a animação para: nada de gastar bateria à toa.
    new IntersectionObserver(([e]) => e.isIntersecting ? ligar() : parar()).observe(hero);

    const conduzir = e => {
      const toque = e.touches && e.touches[0];
      if (!toque) return;
      conduzindo = true;
      alvoX = toque.clientX;
      alvoY = toque.clientY;
    };
    hero.addEventListener("touchstart", conduzir, { passive: true });
    hero.addEventListener("touchmove",  conduzir, { passive: true });
    hero.addEventListener("touchend",  () => { conduzindo = false; }, { passive: true });
  }
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
  acenderMaisProxima();
}

/* ------------------------------------------------------------
   No toque não existe hover, então quem aponta o facho é a rolagem:
   a obra mais próxima do centro da tela acende e as outras recuam.
   ------------------------------------------------------------ */
const semHover = matchMedia("(hover:none)").matches;
let obraAcesa = null;

function acenderMaisProxima() {
  if (!semHover || semMovimento) return;
  grade.classList.add("grade--toque");
  const centro = innerHeight / 2;
  let escolhida = null, menor = Infinity;
  $$(".obra", grade).forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const d = Math.abs(r.top + r.height / 2 - centro);
    if (d < menor) { menor = d; escolhida = el; }
  });
  if (escolhida === obraAcesa) return;
  if (obraAcesa) obraAcesa.classList.remove("obra--focada");
  if (escolhida) escolhida.classList.add("obra--focada");
  obraAcesa = escolhida;
}

if (semHover && !semMovimento) {
  let agendado = false;
  const aoRolar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { acenderMaisProxima(); agendado = false; });
  };
  addEventListener("scroll", aoRolar, { passive: true });
  addEventListener("resize", aoRolar, { passive: true });
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