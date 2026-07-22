"""Builds downloadable exports (Markdown / plain text / PDF) from a structured analysis."""

from fpdf import FPDF
from fpdf.enums import XPos, YPos


def _clauses_lines(clauses: list[dict]) -> list[str]:
    lines = []
    for c in clauses:
        lines.append(f"### {c.get('name', 'Clause')} [{c.get('riskLevel', 'n/a')} risk]")
        lines.append(f"- Original: {c.get('original', '')}")
        lines.append(f"- Plain English: {c.get('plainEnglish', '')}")
        lines.append(f"- Suggestion: {c.get('suggestion', '')}")
        lines.append("")
    return lines


def build_markdown(filename: str, result: dict) -> str:
    lines = [f"# LeaseCheck Report — {filename}", ""]
    lines.append(f"**Risk score:** {result.get('riskScore', '—')}/100 ({result.get('riskLevel', 'n/a')})")
    lines.append("")
    lines.append("## Summary")
    lines.append(result.get("summary", ""))
    lines.append("")
    lines.append("## Key Terms")
    for k, v in (result.get("keyTerms") or {}).items():
        lines.append(f"- **{k}:** {v}")
    lines.append("")
    lines.append("## Flagged Clauses")
    lines += _clauses_lines(result.get("clauses") or [])
    lines.append("## Questions Worth Asking")
    for q in result.get("questions") or []:
        lines.append(f"- {q}")
    lines.append("")
    lines.append("## Recommendations")
    for r in result.get("recommendations") or []:
        lines.append(f"- {r}")
    lines.append("")
    lines.append("*This is an informational summary, not legal advice. For legal questions, "
                 "consult a licensed attorney or local tenant rights organization.*")
    return "\n".join(lines)


def build_text(filename: str, result: dict) -> str:
    md = build_markdown(filename, result)
    # Strip the lightest Markdown decoration for a plain-text feel.
    return (
        md.replace("# ", "").replace("## ", "").replace("### ", "")
        .replace("**", "").replace("*This", "This")
    )


def _sanitize(text: str) -> str:
    """The default PDF core fonts only support latin-1; swap common Unicode
    punctuation for ASCII equivalents, then hard-fallback anything left."""
    replacements = {
        "\u2014": "-", "\u2013": "-", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"', "\u2026": "...", "\u00a0": " ",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text.encode("latin-1", "replace").decode("latin-1")


def build_pdf(filename: str, result: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", "B", 16)
    pdf.multi_cell(0, 10, _sanitize(f"LeaseCheck Report - {filename}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 8, _sanitize(f"Risk score: {result.get('riskScore', '-')} / 100 ({result.get('riskLevel', 'n/a')})"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)

    def section(title: str):
        pdf.set_font("Helvetica", "B", 13)
        pdf.multi_cell(0, 9, _sanitize(title), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 10.5)

    def body(text: str):
        pdf.multi_cell(0, 6, _sanitize(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1)

    section("Summary")
    body(result.get("summary", ""))

    section("Key Terms")
    for k, v in (result.get("keyTerms") or {}).items():
        body(f"- {k}: {v}")

    section("Flagged Clauses")
    for c in result.get("clauses") or []:
        body(f"{c.get('name', 'Clause')} [{c.get('riskLevel', 'n/a')} risk]")
        body(f"  Plain English: {c.get('plainEnglish', '')}")
        body(f"  Suggestion: {c.get('suggestion', '')}")

    section("Questions Worth Asking")
    for q in result.get("questions") or []:
        body(f"- {q}")

    section("Recommendations")
    for r in result.get("recommendations") or []:
        body(f"- {r}")

    pdf.set_font("Helvetica", "I", 8.5)
    pdf.multi_cell(
        0, 5,
        "This is an informational summary, not legal advice. For legal questions, "
        "consult a licensed attorney or local tenant rights organization.",
        new_x=XPos.LMARGIN, new_y=YPos.NEXT,
    )

    return bytes(pdf.output())
