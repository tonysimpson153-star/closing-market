// 클로징마켓 거래처 소개 카탈로그
#import "report-theme.typ": report-accent, report-ink, report-ivory, report-muted, report-theme

#show: report-theme.with(
  title: "클로징마켓 거래처 소개",
  author: "클로징마켓",
  rhythm: "report",
  body-size: 10.3pt,
  running-header: true,
)

#set heading(numbering: none)

#let site = "https://closingmarket.netlify.app/"
#let partner-page = "https://closingmarket.netlify.app/partner.html"
#let contact = "mailto:closingmarket.help@gmail.com"

#let label(value) = [#text(size: 8.5pt, weight: "bold", fill: report-accent, tracking: 0.06em)[#value]]
#let divider() = line(length: 100%, stroke: 0.65pt + report-accent)

#let card(title, body) = block(
  fill: report-ivory,
  radius: 7pt,
  inset: 14pt,
  stroke: 0.4pt + luma(214),
  breakable: false,
)[
  #text(size: 12.5pt, weight: "bold", fill: report-ink)[#title]
  #v(0.45em)
  #text(size: 9.5pt, fill: report-muted)[#body]
]

#let mini-card(kicker, title, body) = block(
  fill: white,
  radius: 7pt,
  inset: 12pt,
  stroke: 0.45pt + luma(216),
  breakable: false,
)[
  #text(size: 8pt, weight: "bold", fill: report-accent)[#kicker]
  #v(0.35em)
  #text(size: 11.5pt, weight: "bold", fill: report-ink)[#title]
  #v(0.3em)
  #text(size: 9pt, fill: report-muted)[#body]
]

#let step(n, title, body) = block(inset: (x: 0pt, y: 7pt), breakable: false)[
  #grid(
    columns: (28pt, 1fr),
    column-gutter: 8pt,
    align: (center, top),
    block(width: 25pt, height: 25pt, radius: 50%, fill: report-accent)[#align(center)[#text(size: 9pt, fill: white, weight: "bold")[#n]]],
    [#text(weight: "bold", fill: report-ink)[#title] #linebreak() #text(size: 9.2pt, fill: report-muted)[#body]],
  )
]

// 표지
#page(margin: 0pt, numbering: none, header: none)[
  #image("assets/cafe.jpg", width: 100%, height: 12.2cm, fit: "cover")
  #block(fill: report-ink, inset: (top: 1.1cm, bottom: 1.25cm, x: 1.75cm))[
    #image("assets/closingmarket-logo.png", width: 34pt)
    #v(1.1em)
    #text(size: 26pt, weight: "bold", fill: white)[사업장 물품의 다음 쓰임]
    #v(0.3em)
    #text(size: 15pt, fill: rgb("#F2E7BE"))[거래처 소개 카탈로그]
    #v(1.3em)
    #text(size: 10.5pt, fill: luma(225))[폐업부터 사업장 정리·이전·물품 교체까지. 클로징마켓은 더 이상 사용하지 않는 사업장 집기와 장비를 필요한 사업자, 그리고 필요한 전문 서비스와 연결합니다.]
    #v(1.6em)
    #text(size: 9pt, weight: "bold", fill: report-accent)[CLOSING MARKET  |  BUSINESS ITEMS, NEXT VALUE]
  ]
]

// 서비스 정의
#pagebreak()
#label("WHY CLOSING MARKET")
#v(0.45em)
#heading(level: 1)[폐업물품을 넘어, 사업장 물품의 순환을 연결합니다.]
#text(size: 12pt, fill: report-muted)[클로징마켓은 일반 개인 중고거래가 아니라 사업장에서 사용하던 집기·가구·장비를 거래하고, 필요한 전문 서비스를 찾는 플랫폼입니다.]
#v(1.1em)
#divider()
#v(1.2em)
#grid(
  columns: (1.05fr, 0.95fr),
  column-gutter: 16pt,
  align: top,
  [
    #text(size: 15pt, weight: "bold", fill: report-ink)[사업의 끝과 다음 시작 사이에 필요한 연결]
    #v(0.6em)
    폐업, 사업장 이전, 물품 교체, 공간 정리 과정에는 사용처를 잃은 집기와 장비가 생깁니다. 반대로 창업과 운영을 준비하는 사업자에게는 업소용 중고물품과 관련 전문 서비스가 필요합니다.
    #v(0.6em)
    클로징마켓은 판매자의 물품 등록, 구매자의 지역·카테고리 탐색, 그리고 전문 업체의 서비스 정보 탐색을 하나의 흐름으로 연결합니다.
  ],
  [
    #card([현재 제공 기능], [사업자 인증 기반 물품 등록, 지역·카테고리 탐색, 판매자·구매자 채팅, 찜과 후기, 업체 찾기 기능을 제공합니다.])
    #v(9pt)
    #card([거래처의 고객 접점], [사업장을 정리하거나 새로 준비하는 고객이 필요한 서비스를 탐색하는 흐름 안에서 업체 정보를 소개합니다.])
  ],
)
#v(1.2em)
#figure(image("assets/office.jpg", width: 100%, height: 6.0cm, fit: "cover"), caption: [사무실·매장·창고 등 다양한 사업장에서 나온 집기와 장비가 거래 대상이 됩니다.])

// 고객 상황
#pagebreak()
#label("CUSTOMER MOMENTS")
#v(0.45em)
#heading(level: 1)[거래처가 만나는 고객은 ‘필요한 순간’에 플랫폼을 찾습니다.]
#text(fill: report-muted)[전문 서비스 업체는 단순 노출이 아니라, 사업장 문제를 해결하려는 고객의 구체적인 상황과 맞닿아야 합니다.]
#v(1.2em)
#grid(
  columns: (1fr, 1fr),
  gutter: 11pt,
  mini-card([01 · 정리], [폐업·사업장 정리], [사용하던 집기와 장비를 정리하고 철거·청소·폐기물처리 등 다음 절차를 준비합니다.]),
  mini-card([02 · 이전], [사업장 이전], [공간을 옮기며 기존 물품의 다음 사용처를 찾고 이사·설치·인테리어 상담이 필요합니다.]),
  mini-card([03 · 교체], [물품·장비 교체], [운영 장비를 바꾸며 기존 집기 처분과 새 공간에 맞는 추가 서비스가 필요합니다.]),
  mini-card([04 · 시작], [창업·운영 준비], [업소용 중고 집기·장비를 탐색하고 인테리어·장비·청소 등 준비 서비스를 비교합니다.]),
)
#v(1.4em)
#block(fill: report-ivory, radius: 8pt, inset: 18pt)[
  #text(size: 14.5pt, weight: "bold", fill: report-ink)[고객이 물품을 찾고 정리하는 맥락 안에서, 필요한 전문 서비스를 소개합니다.]
  #v(0.45em)
  #text(fill: report-muted)[클로징마켓의 업체 찾기는 창업과 폐업, 사업장 정리와 운영 준비에 필요한 서비스를 한 곳에서 탐색할 수 있도록 설계되어 있습니다.]
]
#v(1.2em)
#figure(image("assets/warehouse.jpg", width: 100%, height: 5.9cm, fit: "cover"), caption: [업소용 장비·보관 물품·사업장 집기는 업종과 상황에 따라 다음 사용처를 찾을 수 있습니다.])

// 파트너 분야
#pagebreak()
#label("PARTNER CATEGORIES")
#v(0.45em)
#heading(level: 1)[사업의 시작과 끝에 필요한 전문 업체를 소개합니다.]
#text(fill: report-muted)[아래 분야는 클로징마켓 공식 홈페이지의 업체 입점 안내에 공개된 서비스 범위를 기준으로 합니다.]
#v(1.2em)
#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 10pt,
  mini-card([SPACE], [철거·인테리어], [사업장 정리, 원상복구, 새 공간 준비 등 공간 변화에 필요한 서비스를 소개합니다.]),
  mini-card([EQUIPMENT], [장비·수리·이사], [장비 준비, 이전, 설치, 수리 등 물품과 공간을 실제로 옮기고 운영하는 과정의 서비스를 다룹니다.]),
  mini-card([CARE], [청소·폐기물처리], [정리 이후의 청소·방역·폐기물처리처럼 운영 전후에 필요한 서비스를 안내합니다.]),
  mini-card([OPERATIONS], [세무·노무], [사업 운영 과정에서 필요한 전문 상담 정보도 업체 찾기에서 확인할 수 있습니다.]),
  mini-card([CONSULTING], [창업 관련 상담], [새로운 업종과 공간을 준비하는 사업자가 필요한 정보를 탐색할 수 있도록 돕습니다.]),
  mini-card([YOUR EXPERTISE], [서비스 범위를 명확하게], [실제 제공 가능한 서비스, 운영 지역, 업무 범위를 구체적으로 제시할수록 고객의 탐색에 도움이 됩니다.]),
)
#v(1.3em)
#block(stroke: 0.7pt + report-accent, radius: 8pt, inset: 17pt)[
  #text(size: 13.2pt, weight: "bold", fill: report-ink)[일반 광고가 아니라, 필요한 고객이 서비스를 비교하는 탐색 단계에 함께합니다.]
  #v(0.45em)
  #text(fill: report-muted)[업체 정보는 서비스 분야와 지역 등 고객의 판단에 필요한 정보 중심으로 구성됩니다. 실제 제공할 수 없는 조건이나 확인되지 않은 내용을 과장하지 않는 것이 중요합니다.]
]

// 연결 과정
#pagebreak()
#label("HOW PARTNERS CONNECT")
#v(0.45em)
#heading(level: 1)[업체 정보 등록부터 상담 시작까지의 흐름]
#text(fill: report-muted)[현재 공식 홈페이지의 파트너 안내를 기준으로, 고객과 거래처가 연결되는 기본 흐름입니다.]
#v(0.9em)
#step([01], [사업자 인증 기반 정보 등록], [업체명, 연락 가능 정보, 운영 지역 등 기본 정보를 실제 운영 내용과 맞게 준비합니다.])
#step([02], [서비스 분야와 업무 범위 안내], [어떤 상황에서 도움을 줄 수 있는지, 제공 가능한 업무 범위와 지역을 구체적으로 작성합니다.])
#step([03], [고객의 업체 정보 탐색], [창업·사업장 정리·이전 등을 준비하는 이용자가 분야별 업체 정보를 확인하고 비교합니다.])
#step([04], [문의와 상담 협의], [이용자의 문의를 바탕으로 가능한 일정, 업무 범위, 실제 상담 조건을 거래처와 이용자가 직접 협의합니다.])
#v(1.2em)
#grid(
  columns: (0.9fr, 1.1fr),
  column-gutter: 16pt,
  image("assets/cafe.jpg", width: 100%, height: 5.2cm, fit: "cover"),
  [
    #text(size: 14pt, weight: "bold", fill: report-ink)[고객은 실제 문제를 해결할 파트너를 찾습니다.]
    #v(0.45em)
    사업장 물품을 정리하거나 새 공간을 준비하는 고객에게는 물품 거래 이후에도 필요한 절차가 남습니다. 철거, 청소, 인테리어, 이사, 장비, 상담 등 서비스 정보가 정확할수록 적합한 고객과의 연결 가능성이 높아집니다.
  ],
)

// 입점 준비
#pagebreak()
#label("PARTNER ONBOARDING")
#v(0.45em)
#heading(level: 1)[입점 전, 고객이 바로 이해할 수 있는 정보를 준비해 주세요.]
#text(fill: report-muted)[업체 정보는 고객의 판단을 돕는 소개 자료입니다. 실제 운영 정보와 맞는 내용을 작성하는 것이 중요합니다.]
#v(1.1em)
#grid(
  columns: (1fr, 1fr),
  gutter: 12pt,
  card([기본 정보], [업체명, 연락 가능 정보, 운영 지역, 사업자 정보 등 고객이 신뢰할 수 있는 기본 내용을 준비합니다.]),
  card([서비스 범위], [전문 분야, 실제 제공 가능한 업무, 대응 가능한 사업장 유형을 명확하게 작성합니다.]),
  card([고객 안내], [상담 가능 시간, 일정 협의 방식, 현장 확인 여부처럼 상담 전에 알아야 할 조건을 안내합니다.]),
  card([정보 최신화], [지역·서비스 범위·연락 정보가 바뀌면 업체 정보를 최신 상태로 유지합니다.]),
)
#v(1.25em)
#block(fill: report-ink, radius: 8pt, inset: 18pt)[
  #text(size: 14.2pt, weight: "bold", fill: white)[신뢰할 수 있는 정보가, 필요한 고객과의 첫 연결을 만듭니다.]
  #v(0.45em)
  #text(fill: rgb("#E8E5DC"))[클로징마켓은 사업장 물품 거래와 전문 업체 탐색을 함께 다루는 플랫폼입니다. 거래처의 정확한 서비스 정보는 고객이 더 적합한 선택을 하는 데 도움이 됩니다.]
]

// 문의
#pagebreak()
#label("PARTNERSHIP CONTACT")
#v(0.45em)
#heading(level: 1)[클로징마켓과 함께 필요한 고객에게 서비스를 소개하세요.]
#text(size: 12pt, fill: report-muted)[제휴 및 업체 입점 문의는 아래 공식 채널로 접수해 주세요.]
#v(1.2em)
#block(fill: report-ivory, radius: 10pt, inset: 22pt)[
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 18pt,
    [
      #label("OFFICIAL WEBSITE")
      #v(0.35em)
      #link(site)[#text(size: 12pt, weight: "bold", fill: report-ink)[closingmarket.netlify.app]]
      #v(1.1em)
      #label("PARTNER GUIDE")
      #v(0.35em)
      #link(partner-page)[#text(size: 10.5pt, fill: report-ink)[업체 입점 안내 보기]]
    ],
    [
      #label("PARTNERSHIP EMAIL")
      #v(0.35em)
      #link(contact)[#text(size: 12pt, weight: "bold", fill: report-ink, "closingmarket.help@gmail.com")]
      #v(1.1em)
      #label("BUSINESS INFORMATION")
      #v(0.35em)
      #text(size: 10.5pt, fill: report-ink)[상호명: 클로징마켓 #linebreak() 대표자: 김찬영 #linebreak() 사업자등록번호: 347-70-00504]
    ],
  )
]
#v(2.0em)
#align(center)[
  #image("assets/closingmarket-logo.png", width: 52pt)
  #v(0.9em)
  #text(size: 19pt, weight: "bold", fill: report-ink)[사업장 물품의 다음 쓰임을 연결합니다.]
  #v(0.45em)
  #text(size: 10.5pt, fill: report-muted)[폐업부터 사업장 정리·이전·물품 교체까지. 필요한 물품과 전문 서비스를 클로징마켓에서 만나보세요.]
]
#v(2.0em)
#divider()
#v(0.8em)
#text(size: 8.5pt, fill: report-muted)[본 카탈로그는 클로징마켓 공식 홈페이지에 공개된 서비스 안내를 기준으로 작성되었습니다. 서비스 범위와 입점 조건은 운영 정책에 따라 달라질 수 있으므로 제휴 문의 시 최신 내용을 확인해 주세요.]
