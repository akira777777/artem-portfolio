"""Generate the recruiter-ready PDF CV used by the portfolio website."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PDF = ROOT / "output" / "pdf" / "Artem-Mikhailov-CV.pdf"
PUBLIC_PDF = ROOT / "public" / "artem-mikhailov-cv.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4

GRAPHITE = HexColor("#1B1C1B")
GRAPHITE_RAISED = HexColor("#242521")
INK = HexColor("#20211F")
TEXT_DIM = HexColor("#62645D")
TEXT_FAINT = HexColor("#85877F")
PAPER = HexColor("#F6F7F2")
PANEL = HexColor("#ECEEE7")
LINE = HexColor("#D6D9D0")
MINT = HexColor("#C5FFC3")
MINT_DARK = HexColor("#2D6A3A")
WHITE = HexColor("#F2F3ED")


def find_font(*candidates: str) -> Path:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return path
    raise FileNotFoundError(f"Required font is missing. Checked: {candidates}")


def register_fonts() -> None:
    fonts = {
        "CVSans": find_font(
            "C:/Windows/Fonts/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ),
        "CVSansBold": find_font(
            "C:/Windows/Fonts/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ),
        "CVSansOblique": find_font(
            "C:/Windows/Fonts/DejaVuSans-Oblique.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
        ),
        "CVSansCondensed": find_font(
            "C:/Windows/Fonts/DejaVuSansCondensed.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf",
        ),
        "CVSansCondensedBold": find_font(
            "C:/Windows/Fonts/DejaVuSansCondensed-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf",
        ),
        "CVMono": find_font(
            "C:/Windows/Fonts/consola.ttf",
            "C:/Windows/Fonts/DejaVuSansMono.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        ),
        "CVSerifItalic": find_font(
            "C:/Windows/Fonts/DejaVuSerif-Italic.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf",
        ),
    }
    for name, path in fonts.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))


def wrap_text(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_paragraph(
    pdf: canvas.Canvas,
    text: str,
    *,
    x: float,
    y: float,
    width: float,
    font_name: str = "CVSans",
    font_size: float = 8.6,
    leading: float = 12.4,
    color=INK,
) -> float:
    pdf.setFont(font_name, font_size)
    pdf.setFillColor(color)
    for line in wrap_text(text, font_name, font_size, width):
        pdf.drawString(x, y, line)
        y -= leading
    return y


def draw_section_label(
    pdf: canvas.Canvas,
    number: str,
    title: str,
    *,
    x: float,
    y: float,
    width: float,
) -> float:
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVMono", 6.7)
    pdf.drawString(x, y, number)
    pdf.setFillColor(INK)
    pdf.setFont("CVSansBold", 8.3)
    pdf.drawString(x + 28, y - 0.4, title.upper())
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.55)
    pdf.line(x, y - 7, x + width, y - 7)
    return y - 20


def draw_tag_row(
    pdf: canvas.Canvas,
    tags: Iterable[str],
    *,
    x: float,
    y: float,
    max_width: float,
) -> float:
    cursor_x = x
    row_y = y
    font_name = "CVMono"
    font_size = 6.4
    horizontal_padding = 5
    tag_height = 14
    gap = 4

    for tag in tags:
        tag_width = pdfmetrics.stringWidth(tag, font_name, font_size) + horizontal_padding * 2
        if cursor_x + tag_width > x + max_width:
            cursor_x = x
            row_y -= tag_height + gap
        pdf.setFillColor(PANEL)
        pdf.roundRect(cursor_x, row_y - 10, tag_width, tag_height, 3, stroke=0, fill=1)
        pdf.setFillColor(TEXT_DIM)
        pdf.setFont(font_name, font_size)
        pdf.drawString(cursor_x + horizontal_padding, row_y - 5.6, tag)
        cursor_x += tag_width + gap

    return row_y - tag_height - 1


def draw_contact(
    pdf: canvas.Canvas,
    *,
    label: str,
    value: str,
    url: str,
    x: float,
    y: float,
    width: float,
) -> None:
    pdf.setFont("CVMono", 5.8)
    pdf.setFillColor(MINT)
    pdf.drawString(x, y, label.upper())
    pdf.setFont("CVSans", 7.5)
    pdf.setFillColor(WHITE)
    display_lines = wrap_text(value, "CVSans", 7.5, width)
    value_y = y - 10.5
    for line in display_lines:
        pdf.drawString(x, value_y, line)
        text_width = pdfmetrics.stringWidth(line, "CVSans", 7.5)
        pdf.linkURL(
            url,
            (x, value_y - 2, x + text_width, value_y + 8),
            relative=0,
            thickness=0,
        )
        value_y -= 10


def draw_project(
    pdf: canvas.Canvas,
    *,
    index: str,
    title: str,
    role: str,
    description: str,
    stack: str,
    url_label: str,
    url: str,
    x: float,
    y: float,
    width: float,
) -> float:
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVMono", 6.3)
    pdf.drawString(x, y, index)

    title_x = x + 25
    pdf.setFillColor(INK)
    pdf.setFont("CVSansBold", 9.2)
    pdf.drawString(title_x, y - 0.8, title)

    url_width = pdfmetrics.stringWidth(url_label, "CVMono", 6.2)
    url_x = x + width - url_width
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVMono", 6.2)
    pdf.drawString(url_x, y, url_label)
    pdf.linkURL(
        url,
        (url_x, y - 2, url_x + url_width, y + 8),
        relative=0,
        thickness=0,
    )

    y -= 13
    pdf.setFillColor(TEXT_DIM)
    pdf.setFont("CVSansOblique", 6.9)
    pdf.drawString(title_x, y, role)

    y -= 11
    y = draw_paragraph(
        pdf,
        description,
        x=title_x,
        y=y,
        width=width - 25,
        font_size=7.6,
        leading=10.5,
        color=INK,
    )
    pdf.setFillColor(TEXT_FAINT)
    pdf.setFont("CVMono", 6.1)
    pdf.drawString(title_x, y + 1, stack)
    return y - 13


def draw_sidebar_group(
    pdf: canvas.Canvas,
    *,
    title: str,
    items: Iterable[tuple[str, str]],
    x: float,
    y: float,
    width: float,
) -> float:
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVMono", 6.2)
    pdf.drawString(x, y, f"// {title.upper()}")
    y -= 15
    for label, value in items:
        pdf.setFillColor(INK)
        pdf.setFont("CVSansBold", 7.5)
        pdf.drawString(x, y, label)
        y -= 10
        y = draw_paragraph(
            pdf,
            value,
            x=x,
            y=y,
            width=width,
            font_size=7.2,
            leading=10.2,
            color=TEXT_DIM,
        )
        y -= 7
    return y


def build_pdf(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    register_fonts()

    pdf = canvas.Canvas(
        str(output_path),
        pagesize=A4,
        pageCompression=1,
        invariant=1,
        initialFontName="CVSans",
        initialFontSize=10,
    )
    pdf.setTitle("Artem Mikhailov - Curriculum Vitae")
    pdf.setAuthor("Artem Mikhailov")
    pdf.setSubject("Junior Frontend / Web Developer - Prague")
    pdf.setKeywords("frontend developer, React, Next.js, TypeScript, Prague, CV")

    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)

    header_height = 174
    pdf.setFillColor(GRAPHITE)
    pdf.rect(0, PAGE_HEIGHT - header_height, PAGE_WIDTH, header_height, stroke=0, fill=1)
    pdf.setFillColor(GRAPHITE_RAISED)
    pdf.rect(0, PAGE_HEIGHT - header_height, 8, header_height, stroke=0, fill=1)
    pdf.setFillColor(MINT)
    pdf.rect(8, PAGE_HEIGHT - header_height, 3, header_height, stroke=0, fill=1)

    margin_x = 34
    header_top = PAGE_HEIGHT - 31
    pdf.setFillColor(MINT)
    pdf.setFont("CVMono", 6.7)
    pdf.drawString(margin_x, header_top, "AM. / CURRICULUM VITAE")

    name_y = header_top - 42
    pdf.setFillColor(WHITE)
    pdf.setFont("CVSansCondensedBold", 30)
    pdf.drawString(margin_x, name_y, "ARTEM")
    name_width = pdfmetrics.stringWidth("ARTEM", "CVSansCondensedBold", 30)
    pdf.setFillColor(TEXT_FAINT)
    pdf.drawString(margin_x + name_width + 8, name_y, "MIKHAILOV")
    last_name_width = pdfmetrics.stringWidth("MIKHAILOV", "CVSansCondensedBold", 30)
    pdf.setFillColor(MINT)
    pdf.circle(margin_x + name_width + last_name_width + 15.5, name_y + 4, 2.2, stroke=0, fill=1)

    pdf.setFillColor(WHITE)
    pdf.setFont("CVSansBold", 9.8)
    pdf.drawString(margin_x, name_y - 25, "JUNIOR FRONTEND / WEB DEVELOPER")
    pdf.setFillColor(HexColor("#AFB0A9"))
    pdf.setFont("CVSerifItalic", 8.6)
    pdf.drawString(
        margin_x,
        name_y - 43,
        "Responsive interfaces, accessible foundations and dependable delivery.",
    )

    contact_x = 385
    contact_width = 175
    draw_contact(
        pdf,
        label="Location",
        value="Prague, Czech Republic",
        url="https://www.openstreetmap.org/search?query=Prague",
        x=contact_x,
        y=header_top - 2,
        width=contact_width,
    )
    draw_contact(
        pdf,
        label="Email",
        value="artemmikhailov20031001@gmail.com",
        url="mailto:artemmikhailov20031001@gmail.com",
        x=contact_x,
        y=header_top - 32,
        width=contact_width,
    )
    draw_contact(
        pdf,
        label="Phone",
        value="+420 737 500 587",
        url="tel:+420737500587",
        x=contact_x,
        y=header_top - 62,
        width=contact_width,
    )
    draw_contact(
        pdf,
        label="Portfolio",
        value="artem-portfolio-ten.vercel.app",
        url="https://artem-portfolio-ten.vercel.app/",
        x=contact_x,
        y=header_top - 92,
        width=contact_width,
    )
    draw_contact(
        pdf,
        label="GitHub",
        value="github.com/akira777777",
        url="https://github.com/akira777777",
        x=contact_x,
        y=header_top - 122,
        width=contact_width,
    )

    main_x = margin_x
    main_width = 355
    sidebar_x = 415
    sidebar_width = 146
    body_top = PAGE_HEIGHT - header_height - 28

    pdf.setFillColor(PANEL)
    pdf.roundRect(
        sidebar_x - 14,
        49,
        sidebar_width + 28,
        body_top - 33,
        7,
        stroke=0,
        fill=1,
    )

    y = draw_section_label(
        pdf,
        "01",
        "Profile",
        x=main_x,
        y=body_top,
        width=main_width,
    )
    y = draw_paragraph(
        pdf,
        (
            "Prague-based junior frontend developer with a Czech IT Maturita completed "
            "in 2024. I build and deploy responsive interfaces with Next.js, React, "
            "TypeScript and JavaScript, with attention to accessibility, performance "
            "and clear loading, error and success states."
        ),
        x=main_x,
        y=y,
        width=main_width,
        font_size=8.5,
        leading=12.5,
    )
    y -= 14

    y = draw_section_label(
        pdf,
        "02",
        "Selected frontend work",
        x=main_x,
        y=y,
        width=main_width,
    )
    y = draw_project(
        pdf,
        index="P.01",
        title="Rehabilitation Center, Almaty",
        role="Information architecture and frontend implementation",
        description=(
            "Multi-page healthcare demo structured around treatment programs, "
            "doctors, documents, FAQ, pricing and clear enquiry paths."
        ),
        stack="NEXT.JS / TYPESCRIPT / TAILWIND CSS / SEO / ROUTING",
        url_label="LIVE DEMO",
        url="https://reba-eight.vercel.app/",
        x=main_x,
        y=y,
        width=main_width,
    )
    y = draw_project(
        pdf,
        index="P.02",
        title="Barbershop Iron & Steel",
        role="UI design and frontend implementation",
        description=(
            "Responsive booking-focused landing page with a clear hierarchy for "
            "services, barbers, pricing and repeated reservation actions."
        ),
        stack="NEXT.JS / REACT / TAILWIND CSS",
        url_label="LIVE DEMO",
        url="https://barber-am.vercel.app/",
        x=main_x,
        y=y,
        width=main_width,
    )
    y = draw_project(
        pdf,
        index="P.03",
        title="BETZ Sportsbook",
        role="Data-dense frontend interface",
        description=(
            "Responsive sports interface that groups matches, events and live odds "
            "for quick scanning across desktop and mobile screens."
        ),
        stack="NEXT.JS / REACT / RESPONSIVE DATA UI",
        url_label="LIVE DEMO",
        url="https://bwin-1x.vercel.app/",
        x=main_x,
        y=y,
        width=main_width,
    )
    y = draw_project(
        pdf,
        index="P.04",
        title="SecretTravel",
        role="Responsive frontend and multilingual content structure",
        description=(
            "RU / EN travel-concierge demo that organizes hotels, flights, "
            "excursions, pricing and enquiries into a clear responsive flow."
        ),
        stack="NEXT.JS / TYPESCRIPT / TAILWIND CSS / MULTILINGUAL UI",
        url_label="LIVE DEMO",
        url="https://secrettravel.vercel.app/",
        x=main_x,
        y=y,
        width=main_width,
    )
    y = draw_project(
        pdf,
        index="P.05",
        title="Vakalova Dental",
        role="UI design and frontend implementation",
        description=(
            "Calm dental-clinic interface with readable service sections, "
            "doctor profiles and a prominent appointment path."
        ),
        stack="NEXT.JS / TYPESCRIPT / RESPONSIVE UI",
        url_label="LIVE DEMO",
        url="https://dental-clinic-vakalova.vercel.app/",
        x=main_x,
        y=y,
        width=main_width,
    )
    pdf.setFillColor(TEXT_DIM)
    pdf.setFont("CVSans", 6.8)
    portfolio_link_width = pdfmetrics.stringWidth(
        "View the complete case studies on the portfolio", "CVSansBold", 6.8
    )
    portfolio_link_x = main_x + main_width - portfolio_link_width
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVSansBold", 6.8)
    pdf.drawString(
        portfolio_link_x,
        y + 3,
        "View the complete case studies on the portfolio",
    )
    pdf.linkURL(
        "https://artem-portfolio-ten.vercel.app/#projects",
        (portfolio_link_x, y + 1, portfolio_link_x + portfolio_link_width, y + 11),
        relative=0,
        thickness=0,
    )
    y -= 18

    y = draw_section_label(
        pdf,
        "03",
        "Education and experience",
        x=main_x,
        y=y,
        width=main_width,
    )
    pdf.setFillColor(INK)
    pdf.setFont("CVSansBold", 8.3)
    pdf.drawString(main_x, y, "Maturita - Information Technology")
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVMono", 6.4)
    year_width = pdfmetrics.stringWidth("2024", "CVMono", 6.4)
    pdf.drawString(main_x + main_width - year_width, y + 0.5, "2024")
    y -= 12
    y = draw_paragraph(
        pdf,
        (
            "Vyšší odborná škola informačních studií a Střední škola "
            "elektrotechniky, multimédií a informatiky, Prague 9. "
            "Programme: Software Applications and Programming (18-20-M/01)."
        ),
        x=main_x,
        y=y,
        width=main_width,
        font_size=7.25,
        leading=10.4,
        color=TEXT_DIM,
    )
    y -= 7
    pdf.setFillColor(INK)
    pdf.setFont("CVSansBold", 8.3)
    pdf.drawString(main_x, y, "Customer-facing hospitality roles")
    pdf.setFillColor(MINT_DARK)
    pdf.setFont("CVMono", 6.4)
    date_label = "2022-2024 / PRAGUE"
    date_width = pdfmetrics.stringWidth(date_label, "CVMono", 6.4)
    pdf.drawString(main_x + main_width - date_width, y + 0.5, date_label)
    y -= 12
    draw_paragraph(
        pdf,
        (
            "Handled customer requests and payments in busy team environments, "
            "maintained accuracy under pressure and supported smooth daily operations."
        ),
        x=main_x,
        y=y,
        width=main_width,
        font_size=7.25,
        leading=10.4,
        color=TEXT_DIM,
    )

    sidebar_y = body_top - 2
    sidebar_y = draw_sidebar_group(
        pdf,
        title="Core stack",
        items=(
            ("Frontend", "Next.js, React, TypeScript, JavaScript ES6+, HTML5, CSS3, Tailwind CSS"),
            ("Web", "REST APIs, Node.js fundamentals, routing, form validation, Vercel deployment"),
            ("Quality", "Responsive design, accessibility, SEO foundations, performance and error states"),
            ("Workflow", "Git, GitHub, VS Code, Figma inspection and clear communication"),
        ),
        x=sidebar_x,
        y=sidebar_y,
        width=sidebar_width,
    )
    sidebar_y -= 2
    pdf.setStrokeColor(LINE)
    pdf.line(sidebar_x, sidebar_y, sidebar_x + sidebar_width, sidebar_y)
    sidebar_y -= 18

    sidebar_y = draw_sidebar_group(
        pdf,
        title="Languages",
        items=(
            ("Russian", "Native"),
            ("Czech", "B2 - Maturita completed in Czech"),
            ("English", "B2 - Maturita exam level"),
        ),
        x=sidebar_x,
        y=sidebar_y,
        width=sidebar_width,
    )
    sidebar_y -= 1
    pdf.setStrokeColor(LINE)
    pdf.line(sidebar_x, sidebar_y, sidebar_x + sidebar_width, sidebar_y)
    sidebar_y -= 18

    sidebar_y = draw_sidebar_group(
        pdf,
        title="IT foundations",
        items=(
            ("Systems", "SQL and databases, operating systems and computer networks"),
            ("Support", "Software / hardware support and information security foundations"),
        ),
        x=sidebar_x,
        y=sidebar_y,
        width=sidebar_width,
    )
    sidebar_y -= 1
    pdf.setStrokeColor(LINE)
    pdf.line(sidebar_x, sidebar_y, sidebar_x + sidebar_width, sidebar_y)
    sidebar_y -= 18

    draw_sidebar_group(
        pdf,
        title="Work status",
        items=(
            (
                "Czech Republic",
                "Czech secondary-school graduate with labour-market access, subject to valid residence status.",
            ),
        ),
        x=sidebar_x,
        y=sidebar_y,
        width=sidebar_width,
    )

    footer_y = 25
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.55)
    pdf.line(margin_x, footer_y + 12, PAGE_WIDTH - margin_x, footer_y + 12)
    pdf.setFillColor(TEXT_FAINT)
    pdf.setFont("CVMono", 5.9)
    pdf.drawString(
        margin_x,
        footer_y,
        "ARTEM MIKHAILOV / JUNIOR FRONTEND DEVELOPER / PRAGUE",
    )
    footer_right = "PORTFOLIO CV / 01"
    footer_right_width = pdfmetrics.stringWidth(footer_right, "CVMono", 5.9)
    pdf.drawString(PAGE_WIDTH - margin_x - footer_right_width, footer_y, footer_right)

    pdf.showPage()
    pdf.save()


def main() -> None:
    build_pdf(OUTPUT_PDF)
    PUBLIC_PDF.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUTPUT_PDF, PUBLIC_PDF)
    print(f"Generated {OUTPUT_PDF}")
    print(f"Copied to {PUBLIC_PDF}")


if __name__ == "__main__":
    main()
