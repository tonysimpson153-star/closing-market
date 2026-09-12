// 클로징마켓 간략형 거래처 소개 카탈로그
#import "report-theme.typ": report-accent, report-ink, report-ivory, report-muted, report-theme

#show: report-theme.with(
  title: "클로징마켓 거래처 소개",
  author: "클로징마켓",
  rhythm: "report",
  body-size: 10.2pt,
  running-header: false,
)

#set heading(numbering: none)

#let site = "https://closingmarket.netlify.app/"
#let partner = "https://closingmarket.netlify.app/partner.html"
#let contact = "mailto:closingmarket.help@gmail.com"

#let tag(value) = [#text(size: 8.5pt, weight: "bold", fill: report-accent, tracking: 0.05em)[#value]]

#let info-card(title, body) = block(
  fill: white,
  radius: 7pt,
  inset: 12pt,
  stroke: 0.45pt + luma(216),
  breakable: false,
)[
  #text(size: 11.5pt, weight: "bold", fill: report-ink)[#title]
  #v(0.35em)
  #text(size: 8.9pt, fill: report-muted)[#body]
]

// 1쪽: 서비스 한눈에 보기
#page(margin: 0pt, numbering: none, header: none)[
  #image("assets/cafe.jpg", width: 100%, height: 10.4cm, fit: "cover")
  #block(fill: report-ink, inset: (top: 1.15cm, bottom: 1.0cm, x: 1.65cm))[
    #image("assets/closingmarket-logo.png", width: 33pt)
    #v(0.95em)
    #text(size: 24pt, weight: "bold", fill: white)[사업장 물품의 다음 쓰임]
    #v(0.3em)
    #text(size: 13.5pt, fill: rgb("#F2E7BE"))[거래처 소개 요약]
    #v(1.1em)
    #text(size: 10.2pt, fill: luma(225))[폐업부터 사업장 정리·이전·물품 교체까지. 사업장에서 나온 집기와 장비를 필요한 사업자, 그리고 필요한 전문 서비스와 연결합니다.]
  ]
  #block(fill: report-ivory, inset: (top: 0.85cm, bottom: 0.95cm, x: 1.65cm))[
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: 10pt,
      [#tag("SELL") #v(0.35em) #text(weight: "bold", fill: report-ink)[사업장 물품 등록] #linebreak() #text(size: 8.8pt, fill: report-muted)[사업자 인증 후 집기·장비를 등록합니다.]],
      [#tag("FIND") #v(0.35em) #text(weight: "bold", fill: report-ink)[필요한 물품 탐색] #linebreak() #text(size: 8.8pt, fill: report-muted)[지역·카테고리로 업소용 중고물품을 찾습니다.]],
      [#tag("CONNECT") #v(0.35em) #text(weight: "bold", fill: report-ink)[전문 업체 연결] #linebreak() #text(size: 8.8pt, fill: report-muted)[업체 찾기에서 필요한 서비스를 확인합니다.]],
    )
  ]
]

// 2쪽: 거래처 가치와 문의
#pagebreak()
#tag("PARTNERSHIP")
#v(0.45em)
#heading(level: 1)[사업장을 정리하거나 준비하는 고객과 연결됩니다.]
#text(size: 11.5pt, fill: report-muted)[클로징마켓은 일반 개인 중고거래가 아니라, 사업장 물품 거래와 전문 서비스 탐색이 함께 이루어지는 플랫폼입니다.]
#v(1em)

#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  info-card([폐업·사업장 정리], [집기·장비를 정리하고 철거, 청소, 폐기물처리 등 다음 절차를 준비하는 고객]),
  info-card([사업장 이전·물품 교체], [공간을 옮기거나 장비를 바꾸며 이사, 설치, 인테리어 상담이 필요한 고객]),
  info-card([창업·운영 준비], [업소용 중고물품을 찾고 장비, 청소, 인테리어 등 준비 서비스를 비교하는 고객]),
  info-card([전문 서비스 소개], [철거·인테리어·장비·청소·수리·이사·세무·노무 등 서비스 정보를 탐색 흐름 안에서 안내]),
)

#v(1.35em)
#block(fill: report-ink, radius: 8pt, inset: 17pt)[
  #text(size: 13.5pt, weight: "bold", fill: white)[거래처는 이렇게 연결됩니다.]
  #v(0.55em)
  #text(size: 9.4pt, fill: rgb("#E8E5DC"))[업체 정보 등록 → 서비스 분야·운영 지역 안내 → 고객의 업체 탐색 → 문의와 상담 협의]
]

#v(1.25em)
#grid(
  columns: (0.88fr, 1.12fr),
  column-gutter: 16pt,
  image("assets/office.jpg", width: 100%, height: 5.5cm, fit: "cover"),
  [
    #tag("CONTACT")
    #v(0.45em)
    #text(size: 14pt, weight: "bold", fill: report-ink)[제휴 및 업체 입점 문의]
    #v(0.6em)
    #link(site)[#text(size: 10.2pt, weight: "bold", fill: report-ink)[closingmarket.netlify.app]]
    #v(0.35em)
    #link(partner)[#text(size: 9.4pt, fill: report-muted)[업체 입점 안내 보기]]
    #v(0.65em)
    #link(contact)[#text(size: 10.2pt, weight: "bold", fill: report-ink, "closingmarket.help@gmail.com")]
    #v(0.75em)
    #text(size: 8.6pt, fill: report-muted)[상호명: 클로징마켓 #linebreak() 대표자: 김찬영 #linebreak() 사업자등록번호: 347-70-00504]
  ],
)

#v(0.9em)
#text(size: 8.3pt, fill: report-muted)[본 문서는 클로징마켓 공식 홈페이지에 공개된 서비스 안내를 기준으로 작성되었습니다. 서비스 범위와 입점 조건은 제휴 문의 시 최신 내용을 확인해 주세요.]
