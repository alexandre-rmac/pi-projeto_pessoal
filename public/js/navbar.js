
if (!sessionStorage.NOME_USUARIO && window.location.pathname.includes("/usuario/")) {
    window.location = "/login.html";
}

(function () {
    const ROUTES = {
        inicio: "/index.html",
        login: "/login.html",
        cadastro: "/cadastro.html",
        perfil: "/usuario/perfil.html",
        criarDeck: "/usuario/criarDeck.html",
        avisos: "/usuario/mural.html",
    };

    function limparSessao() {
        sessionStorage.clear();
        window.location.href = ROUTES.login;
    }
    window.limparSessao = limparSessao;

    function init() {
        const container = document.getElementById("navbar-container");
        if (!container) return;

        const nome = sessionStorage.getItem("NOME_USUARIO");
        const logado = Boolean(nome && nome.trim());
        const inicial = logado ? nome.trim().charAt(0).toUpperCase() : "";
        const nomeSeguro = logado ? nome : "";

        const linksDeslogado = `
      <a href="${ROUTES.inicio}"   class="navbar-link" data-route="${ROUTES.inicio}">Início</a>
      <a href="${ROUTES.login}"    class="navbar-link" data-route="${ROUTES.login}">Login</a>
      <a href="${ROUTES.cadastro}" class="navbar-link" data-route="${ROUTES.cadastro}">Cadastro</a>
    `;

        const linksLogado = `
      <a href="${ROUTES.perfil}"    class="navbar-link" data-route="${ROUTES.perfil}">Perfil</a>
      <a href="${ROUTES.criarDeck}" class="navbar-link" data-route="${ROUTES.criarDeck}">Criar Deck</a>
      <a href="${ROUTES.avisos}"    class="navbar-link" data-route="${ROUTES.avisos}">Avisos</a>
      <p>|</p>
      <a href="${ROUTES.perfil}" data-route="${ROUTES.perfil}"><span class="navbar-usuario-flag" title="${nomeSeguro}">${inicial}</span></a>
      <a href="#" class="navbar-link navbar-link-sair" id="navbar-sair">Sair<i class="fa-solid fa-arrow-right-from-bracket"></i></a>
    `;

        container.innerHTML = `
      <nav class="navbar">
        <a href="${ROUTES.inicio}" class="navbar-head">
          <span class="navbar-logo" aria-hidden="true"></span>
          <span class="navbar-titulo">A Forja</span>
        </a>
        <div class="navbar-link-container">
          ${logado ? linksLogado : linksDeslogado}
        </div>
      </nav>
    `;

        const path = window.location.pathname;
        container.querySelectorAll(".navbar-link[data-route]").forEach((el) => {
            const rota = el.getAttribute("data-route");
            const ehHome =
                rota === ROUTES.inicio &&
                (path === "/" || path === ROUTES.inicio);
            if (rota === path || ehHome) el.classList.add("active");
        });

        const btnSair = document.getElementById("navbar-sair");
        if (btnSair) {
            btnSair.addEventListener("click", (e) => {
                e.preventDefault();
                limparSessao();
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();