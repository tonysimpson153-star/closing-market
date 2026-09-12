// Markdown adapter entry.
// Prepared projects receive report-theme.typ beside this file.

#import "@preview/cmarker:0.1.10"
#import "@preview/mitex:0.2.7": mitex
#import "report-theme.typ": report-theme

#let markdown-source = "source.md"

#show: report-theme.with(
  title: "클로징마켓 향후 기능 기획서",
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
#cmarker.render(read(markdown-source), math: mitex)
