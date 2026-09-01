import type { Express, Request, Response } from "express";

const IOS_APP_URL = process.env.PUBLIC_IOS_APP_URL || "";
const ANDROID_APP_URL = process.env.PUBLIC_ANDROID_APP_URL || "";
const LOGO_URL = "/manus-storage/A71123BB-7000-4C17-8CB0-B14B00164F80_f02a2e90.png";
const HERO_IMAGE = "/manus-storage/closing-market-startup-ad-broad-market-updated_b3ef74c9.png";
const CLOSURE_IMAGE = "/manus-storage/closing-market-closure-sale-ad-logo-updated_49d32a62.png";
const PROVIDER_IMAGE = "/manus-storage/closing-market-provider-ad-no-people-broad-services_51d5f055.png";

function downloadButton(label: string, url: string, className = "button button-gold") {
  return url
    ? `<a class="${className}" href="${url}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`
    : `<span class="${className} is-disabled" aria-disabled="true">${label}<small>출시 링크 준비 중</small></span>`;
}

export function registerLandingRoutes(app: Express) {
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send("User-agent: *\\nAllow: /\\nSitemap: https://closing-market.onrender.com/sitemap.xml\\n");
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://closing-market.onrender.com/</loc></url>
  <url><loc>https://closing-market.onrender.com/terms</loc></url>
  <url><loc>https://closing-market.onrender.com/privacy</loc></url>
  <url><loc>https://closing-market.onrender.com/support</loc></url>
  <url><loc>https://closing-market.onrender.com/community-policy</loc></url>
</urlset>`);
  });

  app.get(["/", "/home"], (_req: Request, res: Response) => {
    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>클로징마켓 | 사업의 끝, 시작의 가치</title>
  <meta name="description" content="폐업·사업정리 물품을 판매하고, 창업에 필요한 물품과 업체를 찾는 클로징마켓 공식 홈페이지입니다." />
  <meta name="keywords" content="폐업물품, 사업정리, 중고거래, 창업물품, 업체찾기, 클로징마켓" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://closing-market.onrender.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="클로징마켓" />
  <meta property="og:title" content="클로징마켓 | 사업의 끝, 시작의 가치" />
  <meta property="og:description" content="폐업하는 사업자의 물품을 새로운 창업자에게 연결합니다." />
  <meta property="og:url" content="https://closing-market.onrender.com/" />
  <meta property="og:image" content="${HERO_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="클로징마켓 | 사업의 끝, 시작의 가치" />
  <meta name="twitter:description" content="폐업물품 중고거래부터 창업 관련 업체 연결까지." />
  <meta name="twitter:image" content="${HERO_IMAGE}" />
  <link rel="icon" href="${LOGO_URL}" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "클로징마켓",
    url: "https://closing-market.onrender.com/",
    logo: "https://closing-market.onrender.com" + LOGO_URL,
    email: "closingmarket.help@gmail.com",
    description: "폐업·사업정리 물품 중고거래와 창업 관련 업체 연결 플랫폼",
  })}</script>
  <style>
    :root { --ink:#f8f7f2; --muted:#a9a9a4; --line:rgba(255,255,255,.12); --gold:#d4af37; --gold-soft:#f1d783; --panel:#141414; --black:#0a0a0a; --ease:cubic-bezier(.23,1,.32,1); }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--black); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif; line-height:1.6; }
    a { color:inherit; }
    .site { overflow:hidden; }
    .shell { width:min(1160px,100%); margin:0 auto; padding:0 24px; }
    .nav { position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between; height:72px; border-bottom:1px solid var(--line); background:rgba(10,10,10,.88); backdrop-filter:blur(16px); }
    .logo { display:flex; align-items:center; gap:10px; font-size:16px; font-weight:800; letter-spacing:.08em; text-decoration:none; }
    .logo img { width:35px; height:35px; object-fit:contain; }
    .nav-links { display:flex; gap:26px; align-items:center; color:var(--muted); font-size:13px; }
    .nav-links a { text-decoration:none; transition:color 180ms var(--ease); }
    .nav-links a:hover { color:var(--gold-soft); }
    .nav-cta { padding:10px 15px; border:1px solid rgba(212,175,55,.65); color:var(--gold-soft) !important; border-radius:999px; }
    .hero { min-height:calc(100vh - 72px); display:grid; grid-template-columns:1.08fr .92fr; align-items:center; gap:60px; padding:90px 0 105px; position:relative; }
    .hero:before { content:""; position:absolute; width:560px; height:560px; right:-220px; top:-130px; border-radius:50%; background:radial-gradient(circle,rgba(212,175,55,.16),transparent 68%); pointer-events:none; }
    .eyebrow { display:inline-flex; align-items:center; gap:9px; color:var(--gold-soft); font-size:12px; letter-spacing:.14em; font-weight:700; text-transform:uppercase; }
    .eyebrow:before { content:""; width:28px; height:1px; background:var(--gold); }
    h1 { font-size:clamp(45px,7vw,84px); line-height:1.08; letter-spacing:-.065em; margin:23px 0 26px; max-width:660px; }
    h1 em { color:var(--gold-soft); font-style:normal; }
    .hero-copy { font-size:18px; color:#d2d2cd; max-width:550px; line-height:1.8; margin:0 0 33px; }
    .button-row { display:flex; flex-wrap:wrap; gap:12px; }
    .button { display:inline-flex; align-items:center; justify-content:center; gap:12px; min-height:50px; padding:0 21px; border-radius:7px; text-decoration:none; font-weight:750; font-size:14px; transition:transform 160ms var(--ease),background 160ms var(--ease),border-color 160ms var(--ease); }
    .button:hover { transform:translateY(-2px); }
    .button:active { transform:scale(.97); }
    .button-gold { background:var(--gold); color:#101010; }
    .button-dark { border:1px solid rgba(255,255,255,.24); color:var(--ink); }
    .button-dark:hover { border-color:var(--gold); }
    .is-disabled { cursor:not-allowed; opacity:.58; flex-direction:column; gap:0; padding:8px 21px; }
    .is-disabled small { font-size:10px; font-weight:500; color:#222; }
    .hero-card { position:relative; border:1px solid rgba(212,175,55,.45); background:#171717; padding:10px; box-shadow:0 28px 80px rgba(0,0,0,.38); transform:rotate(2deg); }
    .hero-card img { display:block; width:100%; aspect-ratio:4/5; object-fit:cover; filter:saturate(.78) contrast(1.04); }
    .hero-card-caption { position:absolute; left:26px; bottom:24px; padding:11px 15px; background:rgba(10,10,10,.82); border-left:2px solid var(--gold); font-size:12px; color:#eee; }
    .marquee { border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:19px 0; color:var(--gold-soft); font-size:12px; letter-spacing:.16em; text-transform:uppercase; }
    .marquee span { margin-right:34px; }
    section { padding:110px 0; }
    .section-head { display:flex; justify-content:space-between; align-items:end; gap:30px; margin-bottom:44px; }
    .section-kicker { color:var(--gold-soft); font-size:12px; letter-spacing:.16em; font-weight:750; }
    h2 { font-size:clamp(30px,4.5vw,54px); line-height:1.15; letter-spacing:-.055em; margin:10px 0 0; max-width:650px; }
    .section-intro { max-width:380px; color:var(--muted); font-size:14px; line-height:1.8; margin:0; }
    .manifesto { background:linear-gradient(115deg,#161616,#0e0e0e); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
    .manifesto-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); }
    .manifesto-item { background:#111; padding:32px 28px; min-height:210px; }
    .number { color:var(--gold); font-size:13px; letter-spacing:.12em; }
    .manifesto-item h3 { margin:42px 0 8px; font-size:21px; letter-spacing:-.04em; }
    .manifesto-item p { margin:0; color:var(--muted); font-size:14px; line-height:1.7; }
    .steps { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .step-card { border:1px solid var(--line); background:var(--panel); padding:30px; border-radius:3px; }
    .step-card h3 { margin:6px 0 23px; font-size:24px; letter-spacing:-.04em; }
    .step-list { display:flex; flex-direction:column; gap:14px; }
    .step-list div { display:flex; align-items:center; gap:12px; color:#ddd; font-size:14px; }
    .step-list div:before { content:""; width:8px; height:8px; border:1px solid var(--gold); border-radius:50%; flex:none; }
    .step-card.gold-card { background:linear-gradient(145deg,#d4af37,#9a781e); color:#111; }
    .gold-card .number,.gold-card p { color:#332b15; }
    .gold-card .step-list div { color:#17130a; }
    .gold-card .step-list div:before { border-color:#17130a; }
    .audience { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; }
    .audience-list { display:grid; gap:12px; }
    .audience-item { display:flex; align-items:center; gap:18px; padding:18px 0; border-bottom:1px solid var(--line); color:#ddd; font-size:16px; }
    .audience-item b { display:grid; place-items:center; width:30px; height:30px; border:1px solid var(--gold); border-radius:50%; color:var(--gold-soft); font-size:12px; }
    .category-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; }
    .category { aspect-ratio:1; display:flex; align-items:end; padding:16px; border:1px solid var(--line); background:linear-gradient(145deg,#1a1a1a,#101010); color:#eee; font-weight:700; font-size:14px; position:relative; overflow:hidden; }
    .category:before { content:""; position:absolute; width:64px; height:64px; border:1px solid rgba(212,175,55,.45); border-radius:50%; right:-15px; top:-15px; }
    .category span { position:relative; }
    .feature-grid { display:grid; grid-template-columns:1.25fr .75fr; gap:16px; }
    .feature { min-height:420px; position:relative; overflow:hidden; border:1px solid var(--line); background:#151515; }
    .feature img { width:100%; height:100%; object-fit:cover; opacity:.72; filter:saturate(.62); transition:transform 500ms var(--ease); }
    .feature:hover img { transform:scale(1.04); }
    .feature-overlay { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:end; padding:28px; background:linear-gradient(transparent 25%,rgba(0,0,0,.92)); }
    .feature-overlay h3 { font-size:28px; margin:0 0 6px; letter-spacing:-.05em; }
    .feature-overlay p { margin:0; color:#c5c5bf; font-size:14px; }
    .download { background:var(--gold); color:#111; padding:84px 0; }
    .download-grid { display:flex; align-items:center; justify-content:space-between; gap:30px; }
    .download h2 { color:#111; max-width:590px; }
    .download p { color:#3d3216; max-width:500px; margin:18px 0 0; }
    .download .button-dark { border-color:#5f4b16; color:#111; }
    footer { border-top:1px solid var(--line); padding:44px 0 50px; color:var(--muted); font-size:12px; }
    .footer-top { display:flex; justify-content:space-between; gap:30px; }
    .footer-links { display:flex; flex-wrap:wrap; gap:18px; }
    .footer-links a { color:#d0d0c9; text-decoration:none; }
    .business { margin-top:28px; line-height:1.9; }
    @media (max-width:820px) { .shell{padding:0 18px}.nav{height:64px}.nav-links a:not(.nav-cta){display:none}.hero{grid-template-columns:1fr;gap:45px;padding:68px 0 80px}.hero-card{max-width:520px;margin:0 auto;transform:rotate(1deg)}section{padding:78px 0}.section-head{display:block}.section-intro{margin-top:18px}.manifesto-grid{grid-template-columns:1fr}.manifesto-item{min-height:auto}.steps,.audience,.feature-grid{grid-template-columns:1fr}.category-grid{grid-template-columns:repeat(4,1fr)}.category{aspect-ratio:1.2;padding:12px;font-size:12px}.download-grid{display:block}.download .button-row{margin-top:26px}.footer-top{display:block}.footer-links{margin-top:24px} }
    @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button,.feature img{transition:none}}
  </style>
</head>
<body>
<div class="site">
  <header class="nav"><div class="shell" style="display:flex;align-items:center;justify-content:space-between;width:100%"><a class="logo" href="/"><img src="${LOGO_URL}" alt="클로징마켓 로고" />클로징마켓</a><nav class="nav-links" aria-label="주요 메뉴"><a href="#service">서비스</a><a href="#how">이용 방법</a><a href="#providers">업체 찾기</a><a class="nav-cta" href="#download">앱에서 시작하기</a></nav></div></header>
  <main>
    <div class="shell"><section class="hero" aria-labelledby="hero-title"><div><div class="eyebrow">사업의 끝, 시작의 가치</div><h1 id="hero-title">끝난 사업에<br /><em>새로운 가치</em>를<br />연결합니다.</h1><p class="hero-copy">폐업을 준비하는 사업자는 사용하던 물품과 집기를 판매하고, 창업을 준비하는 사람은 필요한 물품과 업체를 한 곳에서 찾습니다.</p><div class="button-row">${downloadButton("앱에서 시작하기", IOS_APP_URL || ANDROID_APP_URL)}<a class="button button-dark" href="#service">서비스 둘러보기 <span aria-hidden="true">↓</span></a></div></div><div class="hero-card"><img src="${HERO_IMAGE}" alt="다양한 업종의 폐업물품과 창업 준비 물품" /><div class="hero-card-caption">폐업물품 중고거래 · 업체 연결</div></div></section></div>
    <div class="marquee"><div class="shell"><span>LIQUIDATE WITH VALUE</span><span>START WITH CONFIDENCE</span><span>CONNECT THE NEXT</span></div></div>
    <section id="service"><div class="shell"><div class="section-head"><div><div class="section-kicker">01 / ABOUT CLOSING MARKET</div><h2>사업의 마지막을<br />누군가의 시작으로.</h2></div><p class="section-intro">클로징마켓은 사업 정리와 새로운 창업 사이에 필요한 거래와 연결을 한 곳에 모은 플랫폼입니다.</p></div><div class="manifesto-grid"><article class="manifesto-item"><div class="number">01</div><h3>폐업자는 판매</h3><p>사업장에서 사용하던 물품과 집기를 등록하고, 필요한 구매자와 채팅으로 연결됩니다.</p></article><article class="manifesto-item"><div class="number">02</div><h3>창업자는 발견</h3><p>지역과 카테고리로 필요한 중고 물품을 찾아 합리적인 선택을 시작할 수 있습니다.</p></article><article class="manifesto-item"><div class="number">03</div><h3>업체까지 한 곳에서</h3><p>철거·인테리어·청소 등 창업과 폐업에 필요한 전문 업체를 탐색할 수 있습니다.</p></article></div></div></section>
    <section id="how" style="background:#101010"><div class="shell"><div class="section-head"><div><div class="section-kicker">02 / HOW IT WORKS</div><h2>필요한 연결만,<br />간단하게.</h2></div><p class="section-intro">사업을 정리하는 사람과 새로 시작하는 사람 모두에게 필요한 흐름으로 설계했습니다.</p></div><div class="steps"><article class="step-card"><div class="number">FOR SELLERS</div><h3>폐업·사업정리 사업자</h3><div class="step-list"><div>사업자 인증</div><div>물품 등록</div><div>구매자와 채팅</div><div>안전하게 판매</div></div></article><article class="step-card gold-card"><div class="number">FOR STARTERS</div><h3>새로운 창업자</h3><div class="step-list"><div>지역·카테고리 검색</div><div>물품 상태와 정보 확인</div><div>판매자와 채팅</div><div>필요한 물품 구매</div></div></article></div></div></section>
    <section><div class="shell"><div class="audience"><div><div class="section-kicker">03 / WHO IT IS FOR</div><h2>다시 시작할 준비가<br />된 사람들.</h2><p class="section-intro">업종과 상황은 달라도, 더 나은 선택을 원하는 사람이라면 클로징마켓을 사용할 수 있습니다.</p></div><div class="audience-list"><div class="audience-item"><b>01</b>폐업을 준비하고 있는 사업자</div><div class="audience-item"><b>02</b>카페·식당·PC방·헬스장 창업 예정자</div><div class="audience-item"><b>03</b>중고 집기와 장비를 합리적으로 구하려는 사업자</div><div class="audience-item"><b>04</b>철거·인테리어 등 창업 관련 업체를 찾는 사람</div></div></div></div></section>
    <section style="padding-top:0"><div class="shell"><div class="section-head"><div><div class="section-kicker">04 / CATEGORIES</div><h2>업종에 맞는 물품을<br />더 빠르게.</h2></div><p class="section-intro">현재 앱에서 제공하는 주요 카테고리입니다.</p></div><div class="category-grid"><div class="category"><span>카페</span></div><div class="category"><span>음식점</span></div><div class="category"><span>PC방</span></div><div class="category"><span>헬스장</span></div><div class="category"><span>사무실</span></div><div class="category"><span>창고</span></div><div class="category"><span>기타</span></div></div></div></section>
    <section id="providers" style="padding-top:0"><div class="shell"><div class="section-head"><div><div class="section-kicker">05 / FIND A PROVIDER</div><h2>사업의 시작과 끝에<br />필요한 전문가.</h2></div><p class="section-intro">창업과 폐업에 필요한 업체를 카테고리별로 찾고, 문의와 연결까지 이어갈 수 있습니다.</p></div><div class="feature-grid"><article class="feature"><img src="${PROVIDER_IMAGE}" alt="클로징마켓 전문 업체 입점 안내" /><div class="feature-overlay"><h3>전문 업체 찾기</h3><p>철거 · 인테리어 · 장비 · 청소 · 폐기물처리 · 이사 · 수리 · 세무·노무</p></div></article><article class="feature"><img src="${CLOSURE_IMAGE}" alt="클로징마켓 폐업 물품 판매 안내" /><div class="feature-overlay"><h3>필요한 연결</h3><p>채팅 · 찜 · 후기 · 사업자 인증</p></div></article></div></div></section>
    <section id="download" class="download"><div class="shell"><div class="download-grid"><div><div class="section-kicker" style="color:#473916">START YOUR NEXT CHAPTER</div><h2>폐업은 끝이 아니라<br />누군가의 시작이 될 수 있습니다.</h2><p>클로징마켓에서 사업의 다음 장면을 시작하세요.</p></div><div class="button-row">${downloadButton("iOS 다운로드", IOS_APP_URL, "button button-dark")}${downloadButton("Android 다운로드", ANDROID_APP_URL, "button button-dark")}</div></div></div></section>
  </main>
  <footer><div class="shell"><div class="footer-top"><a class="logo" href="/"><img src="${LOGO_URL}" alt="" />클로징마켓</a><div class="footer-links"><a href="/privacy">개인정보처리방침</a><a href="/terms">이용약관</a><a href="/support">고객지원/문의</a><a href="/community-policy">신고 및 커뮤니티 운영정책</a></div></div><div class="business">상호명: 클로징마켓 · 대표자명: 김찬영 · 사업자등록번호: 347-70-00504<br />문의: closingmarket.help@gmail.com<br />클로징마켓은 회원 간 물품 거래와 전문 업체 연결을 제공하는 플랫폼입니다.</div></div></footer>
</div>
</body>
</html>`;
    res.status(200).type("html").send(html);
  });
}
