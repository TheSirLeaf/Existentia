// ============================================================================
// background.js — Gerenciador central de backgrounds animados
//
// Responsabilidades:
// 1. Obter o <canvas> (renderizado pelo componente BackgroundCanvas.razor)
// 2. Escolher qual background rodar (constelacao ou baroque) baseado no layout
// 3. Reiniciar o background quando o Blazor navega
// 4. Gerenciar troca de tema (dark/light) em runtime
//
// Scripts ficam em <head> — sobrevivem a re-renders do <body>.
// O canvas é um componente Blazor (BackgroundCanvas.razor) — o Blazor
// preserva o elemento no DOM fazendo diffing, então as referências JS
// continuam válidas após reconexões e navegações.
// ============================================================================

(() => {

    // --- Estado global ---
    // activeTheme: "dark" ou "light" — lido do localStorage na inicialização
    // activeStyle: "constelacao", "baroque" ou null — qual background está rodando
    // running: se algum background está ativo
    var activeTheme = localStorage.getItem("existentia-theme") || "dark";
    var activeStyle = null;
    var running = false;


    // --- getCanvas() — Obtém o <canvas> do DOM ---
    // O canvas é renderizado pelo componente BackgroundCanvas.razor, que vive
    // antes de <Routes /> no App.razor. O Blazor preserva o elemento porque
    // o output do componente é sempre o mesmo (diffing → sem substituição).
    function getCanvas() {
        return document.getElementById("bg-canvas");
    }


    // --- paleta() — Retorna a paleta de cores do tema atual ---
    // themes.js define window.backgroundThemes com { dark: {...}, light: {...} }
    function pal() {
        return window.backgroundThemes ? window.backgroundThemes[activeTheme] : null;
    }


    // --- stopAll() — Para todos os backgrounds ---
    // Chama .stop() em cada background registrado. Cada um:
    // - cancela o requestAnimationFrame
    // - remove event listeners (resize, mousemove)
    // - reseta variáveis internas
    // Os try/catch evitam erro se o background ainda não foi inicializado
    function stopAll() {
        try { window.constelacaoBackground.stop(); } catch (e) {}
        try { window.buddhaBackground.stop(); } catch (e) {}
        try { window.baroqueBackground.stop(); } catch (e) {}
        running = false;
        activeStyle = null;
    }


    // --- applyThemeClass() — Aplica classe CSS no <html> ---
    // Remove theme-dark/theme-light e aplica a atual.
    // Usado pelo setTheme() para troca em runtime.
    function applyThemeClass() {
        document.documentElement.classList.remove("theme-dark", "theme-light");
        document.documentElement.classList.add("theme-" + activeTheme);
    }


    // ============================================================================
    // detectStyle() — Decide qual background usar baseado no layout atual
    //
    // MainLayout tem um <div class="page"> → constelacao (pontos + linhas)
    // EmptyLayout (login, registro) não tem .page → baroque (curvas animadas)
    //
    // O Seletor ".page" vem do MainLayout.razor:
    //   <div class="page">
    //     <div class="sidebar">...</div>
    //     <main>...</main>
    //   </div>
    // ============================================================================
    function detectStyle() {
        return document.querySelector(".page") ? "constelacao" : "baroque";
    }


    // ============================================================================
    // ensureCanvasSize(c) — Define as dimensões bitmap do canvas
    //
    // canvas.width/height = dimensões em PIXELS DO DISPOSITIVO (bitmap)
    // canvas.style.width/height = dimensões CSS (definidas no componente razor)
    //
    // O bitmap precisa ser viewport × DPR para ficar nítido em telas HiDPI.
    // Ex: tela 1492px com DPR=2 → canvas.width = 2984
    //
    // IMPORTANTE: setting canvas.width SEMPRE limpa o canvas e reseta o contexto.
    // Por isso NÃO setamos canvas.style aqui — o inline style "100vw/100vh"
    // no componente razor já cuida das dimensões CSS.
    // ============================================================================
    function ensureCanvasSize(c) {
        var dpr = window.devicePixelRatio || 1;
        var w = window.innerWidth;
        var h = window.innerHeight;
        c.width = w * dpr;
        c.height = h * dpr;
    }


    // ============================================================================
    // start(style) — Inicia um background específico
    //
    // Fluxo:
    // 1. Verifica se a paleta do tema existe (pal())
    // 2. Se já está rodando o mesmo estilo → retorna (evita reiniciar desnecessário)
    // 3. Para todos os backgrounds anteriores (stopAll)
    // 4. Obtém o canvas (getCanvas — sempre existe, é componente Blazor)
    // 5. Garante dimensões bitmap corretas (ensureCanvasSize)
    // 6. Inicia o background apropriado, passando canvas e paleta
    //
    // ORDEM CRÍTICA:
    // - stopAll() ANTES de getCanvas() → para animações antigas primeiro
    // - getCanvas() ANTES de ensureCanvasSize() → canvas precisa existir
    // - ensureCanvasSize() ANTES de iniciar → background precisa de canvas com dimensões
    // ============================================================================
    function start(style) {
        var p = pal();
        if (!p) return;

        // Se já rodando o mesmo estilo, nada a fazer
        if (running && activeStyle === style) return;

        // Para tudo antes de reiniciar
        stopAll();

        // Obtém canvas (sempre existe via BackgroundCanvas.razor)
        var c = getCanvas();
        if (!c) return;

        // Define dimensões bitmap (innerWidth × DPR)
        ensureCanvasSize(c);

        // Inicia o background apropriado com sua paleta de cores
        if (style === "constelacao" && window.constelacaoBackground) {
            // Constelação: pontos flutuantes conectados por linhas
            // Recebe o canvas diretamente (precisa dele para resize/draw)
            window.constelacaoBackground.start(c, p.constelacao);
        } else if (style === "baroque" && window.baroqueBackground) {
            // Baroque: curvas quadráticas animadas com trail semi-transparente
            // Pega o canvas por getElementById internamente
            window.baroqueBackground.start(p.baroque);
        } else if (style === "buddha" && window.buddhaBackground) {
            // Buddha: símbolos manji flutuantes
            // Pega o canvas por getElementById internamente
            window.buddhaBackground.start(p.buddha);
        }

        activeStyle = style;
        running = true;
    }


    // ============================================================================
    // refresh() — Chamado no evento "blazor:navigated"
    //
    // Decide se precisa reiniciar o background. Retorna cedo (não reinicia) SOMENTE
    // se o estilo atual já é o correto para o novo layout.
    //
    // Como o canvas é um componente Blazor (BackgroundCanvas.razor), ele sobrevive
    // a navegações e reconexões — o Blazor preserva o elemento via diffing.
    // Não precisamos mais verificar se o canvas está vivo.
    //
    // Cenários que forçam reinício:
    // - Navegação MainLayout → EmptyLayout (estilo muda: constelacao → baroque)
    // - Navegação EmptyLayout → MainLayout (estilo muda: baroque → constelacao)
    // - Primeira carga (running = false)
    // ============================================================================
    function refresh() {
        var expected = detectStyle();
        if (running && activeStyle === expected) return;
        stopAll();
        start(expected);
    }


    // --- setCookie() — Helper para definir cookie ---
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 86400000);
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
    }


    // ============================================================================
    // window.backgroundManager — API pública para o resto do app
    //
    // switchTo(style): troca o background programaticamente
    // setTheme(theme): troca dark/light em runtime (chamado pelo NavMenu toggle)
    //   - Salva no localStorage + cookie (cookie para SSR, localStorage para JS)
    //   - Aplica classe CSS no <html>
    //   - Envia nova paleta para o background ativo (updatePalette)
    // ============================================================================
    window.backgroundManager = {
        switchTo: function (style) { start(style); },
        setTheme: function (theme) {
            activeTheme = theme;
            localStorage.setItem("existentia-theme", theme);
            setCookie("existentia-theme", theme, 365);
            applyThemeClass();
            // Atualiza paleta do background sem reiniciar
            if (running && activeStyle) {
                var p = pal();
                if (p && p[activeStyle]) {
                    var bg = activeStyle === "constelacao" ? window.constelacaoBackground
                           : activeStyle === "baroque" ? window.baroqueBackground
                           : window.buddhaBackground;
                    if (bg && bg.updatePalette) bg.updatePalette(p[activeStyle]);
                }
            }
        }
    };


    // ============================================================================
    // MONITOR — Detecta e corrige canvas e estilo automaticamente
    //
    // Verifica duas coisas a cada frame:
    //
    // 1. DIMENSÕES DO CANVAS: O Blazor SSR re-renderiza o <body> na reconexão
    //    SignalR, substituindo o <canvas> por um novo com default 300×150.
    //    Se canvas.width !== innerWidth × DPR → corrige e reinicia.
    //
    // 2. ESTILO DO BACKGROUND: blazor:navigated pode disparar ANTES do DOM
    //    ser totalmente atualizado. O detectStyle() ainda vê o .page da página
    //    anterior → refresh() retorna cedo → background errado.
    //    O monitor detecta a mudança de .page e corrige.
    //
    // CUSTO: ~0 (duas comparações de número + uma query de CSS por frame)
    // ============================================================================
    var _expectedW = 0;
    var _lastHasPage = null;

    function monitorCanvas() {
        var c = document.getElementById("bg-canvas");

        // --- Checagem 1: Dimensões do canvas ---
        if (c) {
            var dpr = window.devicePixelRatio || 1;
            var expected = window.innerWidth * dpr;
            if (c.width !== _expectedW) {
                _expectedW = expected;
                if (c.width !== expected || c.height !== window.innerHeight * dpr) {
                    ensureCanvasSize(c);
                    if (running) {
                        var style = activeStyle || detectStyle();
                        stopAll();
                        start(style);
                    }
                }
            }
        }

        // --- Checagem 2: Estilo do background ---
        // Detecta se .page foi adicionado/removido (mudança de layout)
        var hasPage = !!document.querySelector(".page");
        if (_lastHasPage !== null && hasPage !== _lastHasPage && running) {
            var expected2 = detectStyle();
            if (activeStyle !== expected2) {
                stopAll();
                start(expected2);
            }
        }
        _lastHasPage = hasPage;

        requestAnimationFrame(monitorCanvas);
    }


    // ============================================================================
    // Inicialização
    //
    // TIMING:
    // Este script está em <head>, então executa antes do <body> existir.
    // Na primeira vez, document.readyState é "loading" → registra DOMContentLoaded.
    // Se o script carregar tarde (readyState !== "loading"), chama init() direto.
    //
    // init() → start(detectStyle()):
    // 1. detecta o estilo correto para a página atual
    // 2. getCanvas() encontra o canvas (já no DOM via BackgroundCanvas.razor)
    // 3. ensureCanvasSize() define dimensões bitmap
    // 4. inicia o background apropriado
    // 5. monitorCanvas() começa a vigiar as dimensões
    //
    // EVENTO DE NAVEGAÇÃO:
    // blazor:navigated dispara DEPOIS que o Blazor atualiza o DOM.
    // refresh() verifica se o estilo mudou e reinicia se necessário.
    // ============================================================================
    var init = function () {
        start(detectStyle());
        requestAnimationFrame(monitorCanvas);
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    document.addEventListener("blazor:navigated", refresh);
})();
