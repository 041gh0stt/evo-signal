import { NextResponse } from 'next/server';

const html = `<!DOCTYPE html>
<html lang="pt-BR" class="no-js">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pingo · Pingou, rastreou.</title>
  <meta name="description" content="O Pingo identifica exatamente qual anúncio gerou cada conversa no WhatsApp e envia eventos reais de conversão para o Meta Ads. Pare de anunciar no escuro." />
  <meta name="theme-color" content="#050505" />
  <meta property="og:title" content="Pingo · Pingou, rastreou." />
  <meta property="og:description" content="Descubra qual anúncio gerou cada conversa no WhatsApp e envie conversões reais para o Meta Ads automaticamente." />
  <meta property="og:type" content="website" />
  <link rel="icon" href="/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/landing/css/style.css" />
</head>
<body>

  <!-- ICON SPRITE -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor"/></symbol>
      <symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.2A8.5 8.5 0 1 1 21 11.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
      <symbol id="i-link" viewBox="0 0 24 24"><path d="M10.5 13.5a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.5 10.5a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.2-1.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="19" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="5" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.4 19H15a4 4 0 0 0 4-4v-1M15.6 5H9a4 4 0 0 0-4 4v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M21.5 20a6.5 6.5 0 0 0-4.2-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
      <symbol id="i-megaphone" viewBox="0 0 24 24"><path d="M19 5 6 9.5H3.5v5H6L19 19V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 15l1.2 4.5h2.6L10.6 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
      <symbol id="i-cursor" viewBox="0 0 24 24"><path d="M5 4l7 15.5 1.9-6.6L20.5 11 5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
      <symbol id="i-cash" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="M4.5 12.5 10 18 19.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
      <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor"/></symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
      <symbol id="i-wa" viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.8c.5 3 2.4 4.9 5.4 5.4l1.1-1.6 2.1 1.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="i-ig" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1.3" fill="currentColor"/></symbol>
      <symbol id="i-meta" viewBox="0 0 24 24"><path d="M6.6 7.5C4 7.5 2.5 10 2.5 12s1.4 4.5 4.1 4.5c4 0 6.8-9 10.8-9 2.7 0 4.1 2.5 4.1 4.5s-1.5 4.5-4.1 4.5c-4 0-6.8-9-10.8-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
      <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3v5M16 3v5M3.5 11h17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="i-cart" viewBox="0 0 24 24"><circle cx="9.5" cy="20" r="1.6" fill="currentColor"/><circle cx="17.5" cy="20" r="1.6" fill="currentColor"/><path d="M3 4h2.6l2.2 11h10l2.2-8H7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
      <symbol id="i-lead" viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 7v6M16 10h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 5.8-8.5 11.3-8.5 11.3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 12h3l1.5-3 2 5L15 11h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
      <symbol id="i-brief" viewBox="0 0 24 24"><rect x="3" y="7.5" width="18" height="12.5" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
      <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
    </defs>
  </svg>

  <!-- GRAIN + CURSOR + PROGRESS -->
  <div class="grain" aria-hidden="true"></div>
  <div class="cursor" aria-hidden="true"><div class="cursor-dot"></div><div class="cursor-ring"></div></div>
  <div class="scroll-progress" aria-hidden="true"><span id="scrollProgress"></span></div>

  <!-- LOADER -->
  <div class="loader" id="loader" aria-hidden="true">
    <div class="loader-stage">
      <svg class="loader-drop" viewBox="0 0 100 100"><path d="M50 6 C58 26 86 50 86 72 A36 33 0 1 1 14 72 C14 50 42 26 50 6 Z" fill="#10F2A3"/></svg>
      <span class="loader-ripple"></span>
      <span class="loader-ripple loader-ripple--2"></span>
    </div>
    <p class="loader-text"><span>Pingou,</span> <span>rastreou.</span></p>
  </div>

  <!-- NAV -->
  <header class="nav" id="nav">
    <a class="nav-logo" href="#hero" data-cursor="hover" aria-label="Pingo">
      <img class="logo-img" src="/landing/assets/pingo-logo.png" alt="Pingo" />
    </a>
    <nav class="nav-links" aria-label="Navegação">
      <a href="#problema" data-cursor="hover">O problema</a>
      <a href="#solucao" data-cursor="hover">Solução</a>
      <a href="#funcionalidades" data-cursor="hover">Funcionalidades</a>
      <a href="#beneficios" data-cursor="hover">Benefícios</a>
    </nav>
    <a href="#cta" class="btn btn-primary btn-sm magnetic" data-cursor="hover">Começar Agora</a>
  </header>

  <main>

    <!-- ============ HERO ============ -->
    <section class="hero" id="hero">
      <canvas id="heroCanvas" aria-hidden="true"></canvas>
      <div class="hero-glow hero-glow--green" aria-hidden="true"></div>
      <div class="hero-glow hero-glow--blue" aria-hidden="true"></div>
      <div class="hero-inner container-wide">

        <div class="hero-copy">
          <div class="hero-tag">
            <i class="pulse-dot"></i>
            WhatsApp <em>×</em> Meta Ads <em>×</em> Google Ads <em>×</em> Conversions API
          </div>
          <h1 class="hero-title">
            <span class="ht-line"><span class="ht-inner">PARE DE</span></span>
            <span class="ht-line"><span class="ht-inner">ANUNCIAR</span></span>
            <span class="ht-line"><span class="ht-inner">NO&nbsp;<em class="flicker">ESCURO.</em></span></span>
          </h1>
          <p class="hero-sub">Descubra exatamente <strong>qual anúncio gerou cada conversa</strong> no WhatsApp e envie conversões reais para o Meta&nbsp;Ads automaticamente.</p>
          <div class="hero-ctas">
            <a href="#cta" class="btn btn-primary btn-lg magnetic" data-cursor="hover">Começar Agora <svg class="i"><use href="#i-arrow"/></svg></a>
            <a href="#jornada" class="btn btn-ghost btn-lg magnetic" data-cursor="hover"><svg class="i"><use href="#i-play"/></svg> Ver Demonstração</a>
          </div>
          <div class="hero-proof">
            <span><b class="tx-green">100%</b> das conversas rastreáveis</span>
            <span class="sep"></span>
            <span><b class="tx-blue">Eventos reais</b> no pixel</span>
            <span class="sep"></span>
            <span><b class="tx-purple">Setup</b> em minutos</span>
          </div>
        </div>

        <div class="hero-visual" id="heroVisual">
          <div class="mockup-scene" id="mockupScene">
            <div class="mockup" id="mockup">
              <div class="mk-top">
                <span class="mk-dots"><i></i><i></i><i></i></span>
                <span class="mk-url">app.pingo.com.br/dashboard</span>
                <span class="mk-conn"><i class="pulse-dot"></i> WhatsApp Conectado</span>
              </div>
              <div class="mk-body">
                <aside class="mk-side">
                  <div class="mk-brand">
                    <svg viewBox="0 0 100 100"><path d="M50 6 C58 26 86 50 86 72 A36 33 0 1 1 14 72 C14 50 42 26 50 6 Z" fill="#10F2A3"/></svg>
                    pingo
                  </div>
                  <span class="mk-link active">Dashboard</span>
                  <span class="mk-link">Conversas</span>
                  <span class="mk-link">Jornada de Compra</span>
                  <span class="mk-link">Links Rastreáveis</span>
                  <span class="mk-link">Registro de Pixel</span>
                  <span class="mk-link">Relatórios</span>
                </aside>
                <div class="mk-main">
                  <div class="mk-head"><b>Clínica Bella Forma</b><span>Últimos 7 dias ▾</span></div>
                  <div class="mk-stats">
                    <div class="mk-stat"><b class="mk-num" data-value="348">348</b><span>Conversas Totais</span></div>
                    <div class="mk-stat"><b class="mk-num" data-value="214">214</b><span>Rastreadas · 61%</span></div>
                    <div class="mk-stat"><b class="mk-num" data-value="187">187</b><span>Eventos Pixel</span></div>
                    <div class="mk-stat"><b class="mk-num" data-value="61" data-suffix="%">61%</b><span>Taxa de Rastreio</span></div>
                  </div>
                  <div class="mk-cols">
                    <div class="mk-panel">
                      <span class="mk-ptitle">Origem das Conversas</span>
                      <div class="mk-bars">
                        <div class="mk-bar" style="--h:88%;--c:#3B82F6"><i></i><span>Meta</span></div>
                        <div class="mk-bar" style="--h:36%;--c:#10F2A3"><i></i><span>Google</span></div>
                        <div class="mk-bar" style="--h:22%;--c:#8B5CF6"><i></i><span>Orgânico</span></div>
                        <div class="mk-bar" style="--h:78%;--c:#F59E0B"><i></i><span>N/Rastr.</span></div>
                      </div>
                    </div>
                    <div class="mk-panel">
                      <span class="mk-ptitle">Jornada de Compra</span>
                      <div class="mk-jrow" style="--w:100%;--c:#3B82F6"><i></i><span>Novo Lead</span><b>87</b></div>
                      <div class="mk-jrow" style="--w:70%;--c:#8B5CF6"><i></i><span>Em Negociação</span><b>54</b></div>
                      <div class="mk-jrow" style="--w:46%;--c:#F59E0B"><i></i><span>Proposta Enviada</span><b>31</b></div>
                      <div class="mk-jrow" style="--w:30%;--c:#10F2A3"><i></i><span>Fechado ✓</span><b>18</b></div>
                    </div>
                  </div>
                  <div class="mk-recent">
                    <div class="mk-row"><span class="mk-av" style="--c:#3B82F6">B</span><b>Beatriz Almeida</b><span class="chip chip-blue">Meta Ads</span><span class="mk-meta">há 3 min · <svg class="i i-xs tx-green"><use href="#i-zap"/></svg> 3</span></div>
                    <div class="mk-row"><span class="mk-av" style="--c:#8B5CF6">C</span><b>Camila Ferreira</b><span class="chip chip-blue">Meta Ads</span><span class="mk-meta">há 35 min · <svg class="i i-xs tx-green"><use href="#i-zap"/></svg> 4</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="float-badge badge-meta" style="--px:1.6;--py:1.2">
              <svg class="i tx-blue"><use href="#i-meta"/></svg>
              <div><b>Meta Ads</b><small>Campanha identificada</small></div>
            </div>
            <div class="float-badge badge-wa" style="--px:2.2;--py:1.8">
              <svg class="i tx-green"><use href="#i-wa"/></svg>
              <div><b>WhatsApp</b><small>Conversa rastreada</small></div>
            </div>
            <div class="float-badge badge-event" style="--px:2.8;--py:2.2">
              <svg class="i tx-green"><use href="#i-zap"/></svg>
              <div><b>Purchase enviado</b><small>Conversions API</small></div>
              <span class="ev-ok">OK</span>
            </div>

            <div class="hero-mascot" id="heroMascot" aria-hidden="true">
              <svg class="mascot-svg" viewBox="0 0 440 480">
                <defs>
                  <radialGradient id="mgBody" cx="36%" cy="28%" r="85%">
                    <stop offset="0%" stop-color="#8AF8D2"/><stop offset="42%" stop-color="#2EE9A9"/><stop offset="100%" stop-color="#0CBF85"/>
                  </radialGradient>
                </defs>
                <g class="m-ripple">
                  <ellipse cx="220" cy="412" rx="182" ry="52" fill="#0A0F0D"/>
                  <ellipse cx="220" cy="412" rx="148" ry="40" fill="#19D697"/>
                  <ellipse cx="220" cy="412" rx="112" ry="29" fill="#0A0F0D"/>
                  <ellipse cx="220" cy="412" rx="78" ry="19" fill="#19D697"/>
                  <ellipse cx="220" cy="412" rx="44" ry="10" fill="#0A0F0D"/>
                </g>
                <g class="m-bubbles">
                  <circle cx="50" cy="216" r="16" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="11"/>
                  <circle cx="64" cy="274" r="10" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
                </g>
                <g class="m-sparks">
                  <rect x="366" y="116" width="48" height="22" rx="11" transform="rotate(-55 390 127)" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
                  <rect x="382" y="180" width="42" height="20" rx="10" transform="rotate(-28 403 190)" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
                  <rect x="370" y="236" width="34" height="18" rx="9" transform="rotate(-6 387 245)" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
                </g>
                <g class="m-body">
                  <path d="M220 26 C 252 102, 350 196, 350 292 A 130 124 0 1 1 90 292 C 90 196, 188 102, 220 26 Z" fill="url(#mgBody)" stroke="#0A0F0D" stroke-width="17" stroke-linejoin="round"/>
                  <ellipse cx="175" cy="185" rx="14" ry="32" transform="rotate(-30 175 185)" fill="#EFFFF8" opacity=".95"/>
                  <circle cx="201" cy="130" r="8" fill="#EFFFF8" opacity=".9"/>
                  <g class="m-eyes">
                    <ellipse cx="176" cy="266" rx="17" ry="24" fill="#0A0F0D"/><circle cx="170" cy="256" r="6" fill="#fff"/>
                    <ellipse cx="264" cy="266" rx="17" ry="24" fill="#0A0F0D"/><circle cx="258" cy="256" r="6" fill="#fff"/>
                  </g>
                  <path d="M192 300 Q220 308 248 300 Q242 342 220 342 Q198 342 192 300 Z" fill="#0A0F0D"/>
                  <path d="M206 324 Q220 338 234 324 Q220 316 206 324 Z" fill="#B23B52"/>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-scroll" aria-hidden="true"><span class="hs-line"></span> scroll</div>
    </section>

    <!-- ============ MARQUEE ============ -->
    <div class="marquee" aria-hidden="true">
      <div class="marquee-track">
        <span>PINGOU, RASTREOU</span><i>✦</i><span>CADA CONVERSA DEIXA UM RASTRO</span><i>✦</i><span>WHATSAPP × META ADS</span><i>✦</i>
        <span>PINGOU, RASTREOU</span><i>✦</i><span>CADA CONVERSA DEIXA UM RASTRO</span><i>✦</i><span>WHATSAPP × META ADS</span><i>✦</i>
      </div>
    </div>

    <!-- ============ PROBLEMA ============ -->
    <section class="problema" id="problema">
      <div class="container problema-grid">
        <div class="problema-copy">
          <span class="kicker kicker-red">O problema</span>
          <h2>Seu Meta Ads está <em class="tx-red">voando às cegas.</em></h2>
          <p class="lead">Quando alguém compra pelo WhatsApp, o Meta normalmente <strong>perde o rastreio da venda</strong>.</p>
          <p>Você continua investindo sem saber quais campanhas realmente funcionam — escalando criativos ruins e pausando exatamente o que dá lucro.</p>
          <div class="problema-pills">
            <span>Conversões invisíveis</span>
            <span>ROAS distorcido</span>
            <span>Otimização no chute</span>
          </div>
        </div>
        <div class="flow-broken glass" id="flowBroken">
          <div class="fb-node"><svg class="i tx-blue"><use href="#i-megaphone"/></svg> Anúncio</div>
          <div class="fb-seg"></div>
          <div class="fb-node"><svg class="i"><use href="#i-cursor"/></svg> Clique</div>
          <div class="fb-seg"></div>
          <div class="fb-node"><svg class="i tx-green"><use href="#i-wa"/></svg> WhatsApp</div>
          <div class="fb-seg fb-seg--broken"><span class="fb-q">???</span></div>
          <div class="fb-node fb-node--lost"><svg class="i"><use href="#i-cash"/></svg> Venda <small>não atribuída</small></div>
          <div class="fb-alert">Rastreio perdido entre o WhatsApp e a venda</div>
        </div>
      </div>
    </section>

    <!-- ============ SOLUÇÃO ============ -->
    <section class="solucao" id="solucao">
      <div class="container">
        <div class="section-head center">
          <span class="kicker">A solução</span>
          <h2>O Pingo conecta <span class="grad-text">todas as pontas.</span></h2>
          <p class="section-sub">Cada clique vira uma conversa identificada. Cada conversa vira um evento real no seu pixel.</p>
        </div>
        <div class="timeline" id="timeline">
          <div class="tl-track"><span class="tl-fill" id="tlFill"></span></div>
          <div class="tl-steps">
            <div class="tl-step" style="--c:#3B82F6"><div class="tl-dot"><svg class="i"><use href="#i-meta"/></svg></div><h4>Meta Ads</h4><p>Clique com identificador único de campanha</p></div>
            <div class="tl-step" style="--c:#10F2A3"><div class="tl-dot"><svg class="i"><use href="#i-wa"/></svg></div><h4>WhatsApp</h4><p>Conversa atribuída ao anúncio na hora</p></div>
            <div class="tl-step" style="--c:#8B5CF6"><div class="tl-dot"><svg class="i"><use href="#i-route"/></svg></div><h4>Jornada</h4><p>Lead avança pelo funil de compra</p></div>
            <div class="tl-step" style="--c:#F59E0B"><div class="tl-dot"><svg class="i"><use href="#i-zap"/></svg></div><h4>Evento Pixel</h4><p>Lead, Schedule e Purchase disparados</p></div>
            <div class="tl-step" style="--c:#10F2A3"><div class="tl-dot"><svg class="i"><use href="#i-cash"/></svg></div><h4>Venda</h4><p>Atribuída à campanha certa, sem achismo</p></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ FUNCIONALIDADES ============ -->
    <section class="features" id="funcionalidades">
      <div class="container">
        <div class="section-head">
          <span class="kicker">Funcionalidades</span>
          <h2>Tudo o que acontece no WhatsApp,<br/><span class="grad-text">visível no seu tráfego.</span></h2>
        </div>

        <div class="bento">

          <!-- 1. Rastreamento de Conversas -->
          <article class="card span-2" style="--ac:#3B82F6" data-cursor="hover">
            <div class="card-visual">
              <div class="mini mini-track">
                <div class="mini-row head"><span>Contato</span><span>Origem</span><span>Etapa</span></div>
                <div class="mini-row"><b>Beatriz Almeida</b><span class="chip chip-blue">Meta Ads</span><span class="chip chip-ghost">Agendou</span></div>
                <div class="mini-row"><b>Rafael Torres</b><span class="chip chip-blue">Meta Ads</span><span class="chip chip-ghost">Agendou</span></div>
                <div class="mini-row"><b>Camila Ferreira</b><span class="chip chip-blue">Meta Ads</span><span class="chip chip-green">Comprou</span></div>
                <div class="mini-row dim"><b>(41) 98873-1290</b><span class="chip chip-orange">Não rastreada</span><span class="chip chip-ghost">Fez contato</span></div>
                <div class="mini-scan"></div>
              </div>
            </div>
            <div class="card-info">
              <div class="card-ic"><svg class="i"><use href="#i-chat"/></svg></div>
              <h3>Rastreamento de Conversas</h3>
              <p>Descubra exatamente qual anúncio gerou cada conversa.</p>
            </div>
          </article>

          <!-- 2. Links Rastreáveis -->
          <article class="card" style="--ac:#10F2A3" data-cursor="hover">
            <div class="card-visual">
              <div class="mini mini-links">
                <div class="link-row">
                  <span class="link-url">pin.go/<b>harmonizacao</b></span>
                  <span class="link-clicks">284 cliques</span>
                </div>
                <div class="utm-chips"><span>utm_source=meta</span><span>utm_campaign=junho</span></div>
                <div class="link-row">
                  <span class="link-url">pin.go/<b>promo-10</b></span>
                  <span class="link-clicks">97 cliques</span>
                </div>
                <div class="utm-chips"><span>utm_source=google</span><span>utm_medium=cpc</span></div>
              </div>
            </div>
            <div class="card-info">
              <div class="card-ic"><svg class="i"><use href="#i-link"/></svg></div>
              <h3>Links Rastreáveis</h3>
              <p>Crie links inteligentes com UTMs e rastreie campanhas externas.</p>
            </div>
          </article>

          <!-- 3. Jornada de Compra -->
          <article class="card" style="--ac:#8B5CF6" data-cursor="hover">
            <div class="card-visual">
              <div class="mini mini-funnel">
                <div class="f-bar" style="--w:100%;--c:#3B82F6"><i class="f-fill"></i><span>Novo Lead</span><b>87</b></div>
                <div class="f-bar" style="--w:64%;--c:#8B5CF6"><i class="f-fill"></i><span>Em Negociação</span><b>54</b></div>
                <div class="f-bar" style="--w:38%;--c:#F59E0B"><i class="f-fill"></i><span>Proposta Enviada</span><b>31</b></div>
                <div class="f-bar" style="--w:23%;--c:#10F2A3"><i class="f-fill"></i><span>Fechado ✓</span><b>18</b></div>
              </div>
            </div>
            <div class="card-info">
              <div class="card-ic"><svg class="i"><use href="#i-route"/></svg></div>
              <h3>Jornada de Compra</h3>
              <p>Transforme conversas em um funil visual de vendas.</p>
            </div>
          </article>

          <!-- 4. Eventos Automáticos -->
          <article class="card span-2" style="--ac:#F59E0B" data-cursor="hover">
            <div class="card-visual">
              <div class="mini mini-events">
                <div class="ev-list">
                  <div class="ev-row"><span class="ev-type ev-lead"><svg class="i i-xs"><use href="#i-lead"/></svg> Lead</span><b>Beatriz Almeida</b><span class="ev-time">2min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-co"><svg class="i i-xs"><use href="#i-zap"/></svg> InitiateCheckout</span><b>Beatriz Almeida</b><span class="ev-time">4min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-buy"><svg class="i i-xs"><use href="#i-cart"/></svg> Purchase</span><b>Fernanda Costa</b><span class="ev-time">18min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-sch"><svg class="i i-xs"><use href="#i-cal"/></svg> Schedule</span><b>Fernanda Costa</b><span class="ev-time">22min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-lead"><svg class="i i-xs"><use href="#i-lead"/></svg> Lead</span><b>Rafael Torres</b><span class="ev-time">58min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-lead"><svg class="i i-xs"><use href="#i-lead"/></svg> Lead</span><b>Beatriz Almeida</b><span class="ev-time">2min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-co"><svg class="i i-xs"><use href="#i-zap"/></svg> InitiateCheckout</span><b>Beatriz Almeida</b><span class="ev-time">4min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-buy"><svg class="i i-xs"><use href="#i-cart"/></svg> Purchase</span><b>Fernanda Costa</b><span class="ev-time">18min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-sch"><svg class="i i-xs"><use href="#i-cal"/></svg> Schedule</span><b>Fernanda Costa</b><span class="ev-time">22min atrás</span><span class="ev-ok">OK</span></div>
                  <div class="ev-row"><span class="ev-type ev-lead"><svg class="i i-xs"><use href="#i-lead"/></svg> Lead</span><b>Rafael Torres</b><span class="ev-time">58min atrás</span><span class="ev-ok">OK</span></div>
                </div>
              </div>
            </div>
            <div class="card-info">
              <div class="card-ic"><svg class="i"><use href="#i-zap"/></svg></div>
              <h3>Eventos Automáticos</h3>
              <p>Envie Lead, Schedule, Purchase e outros eventos diretamente para o Meta.</p>
            </div>
          </article>

          <!-- 5. Gestão de Conversas -->
          <article class="card span-2" style="--ac:#10F2A3" data-cursor="hover">
            <div class="card-visual">
              <div class="mini mini-chat">
                <div class="wa-msg in">Oi! Vi o anúncio de vocês no Instagram. Quero fazer harmonização facial 😍</div>
                <div class="wa-msg out">Olá Beatriz! Bem-vinda 😊 Posso te passar os valores e agendar uma avaliação gratuita?</div>
                <div class="wa-msg in">Quinta às 15h, perfeito!</div>
                <div class="wa-typing"><i></i><i></i><i></i></div>
                <div class="chat-stage"><svg class="i i-xs"><use href="#i-route"/></svg> Etapa: Agendou</div>
              </div>
            </div>
            <div class="card-info">
              <div class="card-ic"><svg class="i"><use href="#i-grid"/></svg></div>
              <h3>Gestão de Conversas</h3>
              <p>Visualize todas as conversas em um único painel.</p>
            </div>
          </article>

          <!-- 6. Multi Contas -->
          <article class="card" style="--ac:#8B5CF6" data-cursor="hover">
            <div class="card-visual">
              <div class="mini mini-accounts">
                <div class="acc-row"><span class="acc-av" style="--c:#10F2A3">CB</span><div><b>Clínica Bella Forma</b><small><i class="pulse-dot"></i> Conectado</small></div></div>
                <div class="acc-row"><span class="acc-av" style="--c:#3B82F6">SS</span><div><b>Studio Sorriso</b><small><i class="pulse-dot"></i> Conectado</small></div></div>
                <div class="acc-row"><span class="acc-av" style="--c:#8B5CF6">AN</span><div><b>Agência Nort</b><small>12 clientes ativos</small></div></div>
              </div>
            </div>
            <div class="card-info">
              <div class="card-ic"><svg class="i"><use href="#i-users"/></svg></div>
              <h3>Multi Contas</h3>
              <p>Gerencie vários clientes em um único ambiente.</p>
            </div>
          </article>

        </div>
      </div>
    </section>

    <!-- ============ JORNADA (ANIMAÇÃO PRINCIPAL) ============ -->
    <section class="journey" id="jornada">
      <div class="journey-inner">
        <div class="container section-head center">
          <span class="kicker">Em tempo real</span>
          <h2>Do anúncio à venda, <span class="grad-text">sem perder o fio.</span></h2>
        </div>
        <div class="jr-stage" id="jrStage">

          <div class="jr-panel jr-ad">
            <div class="jr-tag"><svg class="i i-xs"><use href="#i-ig"/></svg> Instagram · Patrocinado</div>
            <div class="ig-card">
              <div class="ig-head"><span class="ig-av">BF</span><div><b>bellaforma.clinica</b><small>Patrocinado</small></div></div>
              <div class="ig-media">
                <span class="ig-shine"></span>
                <b>Harmonização Facial</b>
                <small>Avaliação gratuita essa semana</small>
              </div>
              <div class="ig-cta"><svg class="i i-xs"><use href="#i-wa"/></svg> Enviar mensagem</div>
            </div>
            <span class="jr-cap"><b>01</b> O anúncio gera o clique</span>
          </div>

          <div class="jr-link"><i></i><i></i><i></i></div>

          <div class="jr-panel jr-chat">
            <div class="jr-tag"><svg class="i i-xs"><use href="#i-wa"/></svg> WhatsApp</div>
            <div class="wa-card">
              <div class="wa-head"><span class="wa-av">B</span><div><b>Beatriz Almeida</b><small>online</small></div></div>
              <div class="wa-msgs">
                <div class="wa-msg in">Oi! Vi o anúncio de vocês no Instagram 😍</div>
                <div class="wa-msg out">Olá Beatriz! Quer agendar uma avaliação gratuita?</div>
                <div class="wa-msg in">Quinta às 15h, perfeito!</div>
              </div>
            </div>
            <span class="jr-cap"><b>02</b> O lead entra no WhatsApp</span>
          </div>

          <div class="jr-link"><i></i><i></i><i></i></div>

          <div class="jr-panel jr-pingo">
            <div class="jr-tag">
              <svg class="i i-xs" viewBox="0 0 100 100"><path d="M50 6 C58 26 86 50 86 72 A36 33 0 1 1 14 72 C14 50 42 26 50 6 Z" fill="#10F2A3"/></svg>
              Pingo identifica
            </div>
            <div class="pg-card">
              <span class="pg-scan"></span>
              <div class="pg-row"><span>Origem</span><b class="chip chip-blue">Meta Ads</b></div>
              <div class="pg-row"><span>Campanha</span><b>Harmonização · Junho</b></div>
              <div class="pg-row"><span>Criativo</span><b>video_promo_01</b></div>
              <div class="pg-row"><span>Jornada</span><b class="chip chip-green">Agendou</b></div>
            </div>
            <span class="jr-cap"><b>03</b> Origem identificada na hora</span>
          </div>

          <div class="jr-link"><i></i><i></i><i></i></div>

          <div class="jr-panel jr-meta">
            <div class="jr-tag"><svg class="i i-xs"><use href="#i-meta"/></svg> Conversions API</div>
            <div class="mt-card">
              <div class="mt-ev" style="--c:#3B82F6"><svg class="i i-xs"><use href="#i-lead"/></svg> Lead <span class="ev-ok">✓</span></div>
              <div class="mt-ev" style="--c:#8B5CF6"><svg class="i i-xs"><use href="#i-cal"/></svg> Schedule <span class="ev-ok">✓</span></div>
              <div class="mt-ev" style="--c:#10F2A3"><svg class="i i-xs"><use href="#i-cart"/></svg> Purchase <span class="ev-ok">✓</span></div>
              <div class="mt-total">3 conversões reais no seu pixel</div>
            </div>
            <span class="jr-cap"><b>04</b> Eventos reais no Meta</span>
          </div>

        </div>
      </div>
    </section>

    <!-- ============ BENEFÍCIOS ============ -->
    <section class="benefits" id="beneficios">
      <div class="container">
        <div class="section-head center">
          <span class="kicker">Resultados</span>
          <h2>Mais dados. Mais inteligência. <span class="grad-text">Mais vendas.</span></h2>
        </div>
        <div class="bn-grid">
          <div class="bn-item">
            <span class="bn-num" data-value="5" data-suffix="min">5min</span>
            <b>Setup completo</b>
            <p>conecte o WhatsApp e o pixel, sem código e sem fricção.</p>
          </div>
          <div class="bn-item">
            <span class="bn-num" data-value="100" data-suffix="%">100%</span>
            <b>Conversões automáticas</b>
            <p>Lead, Schedule e Purchase direto na Conversions API.</p>
          </div>
          <div class="bn-item">
            <span class="bn-num" data-value="24" data-suffix="h">24h</span>
            <b>Monitoramento contínuo</b>
            <p>cada conversa acompanhada em tempo real.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ PARA QUEM ============ -->
    <section class="audience" id="paraquem">
      <div class="container">
        <div class="section-head center">
          <span class="kicker">Para quem é</span>
          <h2>Feito para quem vende <span class="grad-text">onde o cliente responde.</span></h2>
        </div>
        <div class="aud-grid">
          <article class="aud-card" style="--ac:#8B5CF6" data-cursor="hover">
            <div class="aud-ic"><svg class="i"><use href="#i-brief"/></svg></div>
            <h3>Agências</h3>
            <p class="aud-lead">Comprove o ROI dos seus clientes.</p>
            <p>Atribuição clara por conta, relatórios que renovam contratos.</p>
          </article>
          <article class="aud-card" style="--ac:#3B82F6" data-cursor="hover">
            <div class="aud-ic"><svg class="i"><use href="#i-heart"/></svg></div>
            <h3>Clínicas</h3>
            <p class="aud-lead">Descubra quais campanhas geram pacientes.</p>
            <p>Da primeira mensagem ao procedimento fechado.</p>
          </article>
          <article class="aud-card" style="--ac:#10F2A3" data-cursor="hover">
            <div class="aud-ic"><svg class="i"><use href="#i-chat"/></svg></div>
            <h3>Empresas que vendem pelo WhatsApp</h3>
            <p class="aud-lead">Pare de tomar decisões no escuro.</p>
            <p>Cada real investido com retorno visível.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ CTA FINAL ============ -->
    <section class="cta-final" id="cta">
      <canvas id="ctaCanvas" aria-hidden="true"></canvas>
      <div class="cta-inner container">
        <div class="cta-mascot" aria-hidden="true">
          <svg class="mascot-svg" viewBox="0 0 440 480">
            <g class="m-ripple">
              <ellipse cx="220" cy="412" rx="182" ry="52" fill="#0A0F0D"/>
              <ellipse cx="220" cy="412" rx="148" ry="40" fill="#19D697"/>
              <ellipse cx="220" cy="412" rx="112" ry="29" fill="#0A0F0D"/>
              <ellipse cx="220" cy="412" rx="78" ry="19" fill="#19D697"/>
              <ellipse cx="220" cy="412" rx="44" ry="10" fill="#0A0F0D"/>
            </g>
            <g class="m-bubbles">
              <circle cx="50" cy="216" r="16" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="11"/>
              <circle cx="64" cy="274" r="10" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
            </g>
            <g class="m-sparks">
              <rect x="366" y="116" width="48" height="22" rx="11" transform="rotate(-55 390 127)" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
              <rect x="382" y="180" width="42" height="20" rx="10" transform="rotate(-28 403 190)" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
              <rect x="370" y="236" width="34" height="18" rx="9" transform="rotate(-6 387 245)" fill="#2EE9A9" stroke="#0A0F0D" stroke-width="10"/>
            </g>
            <g class="m-body">
              <path d="M220 26 C 252 102, 350 196, 350 292 A 130 124 0 1 1 90 292 C 90 196, 188 102, 220 26 Z" fill="url(#mgBody)" stroke="#0A0F0D" stroke-width="17" stroke-linejoin="round"/>
              <ellipse cx="175" cy="185" rx="14" ry="32" transform="rotate(-30 175 185)" fill="#EFFFF8" opacity=".95"/>
              <circle cx="201" cy="130" r="8" fill="#EFFFF8" opacity=".9"/>
              <g class="m-eyes">
                <ellipse cx="176" cy="266" rx="17" ry="24" fill="#0A0F0D"/><circle cx="170" cy="256" r="6" fill="#fff"/>
                <ellipse cx="264" cy="266" rx="17" ry="24" fill="#0A0F0D"/><circle cx="258" cy="256" r="6" fill="#fff"/>
              </g>
              <path d="M192 300 Q220 308 248 300 Q242 342 220 342 Q198 342 192 300 Z" fill="#0A0F0D"/>
              <path d="M206 324 Q220 338 234 324 Q220 316 206 324 Z" fill="#B23B52"/>
            </g>
          </svg>
        </div>
        <h2 class="cta-title">Cada conversa deixa <span class="grad-text">um rastro.</span></h2>
        <p class="cta-slogan">Pingou, <em>rastreou.</em></p>
        <a href="#" class="btn btn-primary btn-xl magnetic" data-cursor="hover">Começar Agora <svg class="i"><use href="#i-arrow"/></svg></a>
        <p class="cta-micro">Setup em minutos · Sem cartão de crédito</p>
      </div>
    </section>

  </main>

  <!-- ============ FOOTER ============ -->
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a class="nav-logo" href="#hero" data-cursor="hover">
          <img class="logo-img logo-img--footer" src="/landing/assets/pingo-logo.png" alt="Pingo" />
        </a>
        <p>Rastreamento real de conversas para quem vende pelo WhatsApp.</p>
      </div>
      <nav class="footer-links" aria-label="Links do rodapé">
        <a href="#problema" data-cursor="hover">O problema</a>
        <a href="#solucao" data-cursor="hover">Solução</a>
        <a href="#funcionalidades" data-cursor="hover">Funcionalidades</a>
        <a href="#beneficios" data-cursor="hover">Benefícios</a>
        <a href="#cta" data-cursor="hover">Começar</a>
      </nav>
    </div>
    <div class="container footer-bottom">
      <span>© <span id="year">2026</span> Pingo — Pingou, rastreou.</span>
      <span>WhatsApp × Meta Ads × Google Ads × Conversions API</span>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
  <script src="/landing/js/main.js"></script>
</body>
</html>`;

export function GET() {
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
