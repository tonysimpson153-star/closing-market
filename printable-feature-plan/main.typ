// Markdown adapter entry.
// Prepared projects receive report-theme.typ beside this file.

#import "@preview/cmarker:0.1.10"
#import "@preview/mitex:0.2.7": mitex
#import "report-theme.typ": report-theme

#let markdown-source = "master-source.md"
#let visual = (name, width: auto, height: auto) => image(
  "assets/" + name,
  width: width,
  height: height,
)
#let app-screen-grid = (left, left-caption, right, right-caption, caption) => figure(
  grid(
    columns: (1fr, 1fr),
    gutter: 12pt,
    align(center)[
      #visual(left, width: 74%)
      #v(4pt)
      #text(size: 8.5pt, weight: "medium")[#left-caption]
    ],
    align(center)[
      #visual(right, width: 74%)
      #v(4pt)
      #text(size: 8.5pt, weight: "medium")[#right-caption]
    ],
  ),
  caption: caption,
)

#show: report-theme.with(
  title: "클로징마켓 프로젝트 전체 마스터 문서",
  author: "Manus AI",
  rhythm: "longform",
  body-size: 10.2pt,
  first-line-indent: none,
  running-header: true,
)

// cmarker emits tables with all-auto column widths. Re-emit those tables as
// full-width, booktabs-style tables while leaving explicitly sized tables alone.
#show table: it => {
  if it.columns.len() > 0 and it.columns.all(column => column == auto) {
    table(
      columns: (1fr,) * it.columns.len(),
      align: it.align,
      stroke: none,
      inset: (x: 7pt, y: 6pt),
      fill: (_, y) => if y > 0 and calc.even(y) { luma(248) } else { none },
      table.hline(stroke: 1pt),
      ..it.children.filter(
        child => child.func() != table.hline and child.func() != table.vline,
      ),
      table.hline(stroke: 1pt),
    )
  } else {
    it
  }
}
#show table.cell.where(y: 0): set text(weight: "bold")

// mitex renders LaTeX equations found in the Markdown source.
#cmarker.render(
  read(markdown-source),
  math: mitex,
  scope: (visual: visual, app-screen-grid: app-screen-grid),
)
