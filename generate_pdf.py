import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 762, "VoiceCart AI — Complete Project Source Code Document")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)
        
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_text)
        self.drawString(36, 25, "Confidential & Proprietary — VoiceCart AI Project Submission")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 36, 576, 36)
        
        self.restoreState()

def create_code_pdf(output_filename="VoiceCart_AI_Complete_Codebase.pdf"):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=48,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#4F46E5"),
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    heading_style = ParagraphStyle(
        'FileHeading',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1E1B4B"),
        spaceBefore=14,
        spaceAfter=4,
        keepWithNext=True
    )

    meta_style = ParagraphStyle(
        'MetaText',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=8,
        keepWithNext=True
    )

    code_style = ParagraphStyle(
        'CodeBlock',
        fontName='Courier',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=0,
        spaceAfter=0
    )

    story = []

    # Document Header
    story.append(Paragraph("VoiceCart AI — Source Code Documentation", title_style))
    story.append(Paragraph("Complete Technical Assessment Implementation Codebase", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=12))

    files_to_include = [
        ("index.html", "HTML5 Layout, Modals & Voice Control HUD Interface"),
        ("styles.css", "CSS Styling, Glassmorphism, Badge Colors & Visualizer Animations"),
        ("js/app.js", "Main Application Controller & Event Dispatcher"),
        ("js/voice.js", "Web Speech Recognition & Text-to-Speech Synthesis Engine"),
        ("js/nlp.js", "Natural Language Intent Parser & Recipe Bundles Engine"),
        ("js/suggestions.js", "Smart Recommendations, History & Product Substitutes Engine"),
        ("js/storage.js", "LocalStorage Persistence Layer & Pre-loaded Product DB"),
        ("js/sound.js", "Web Audio API SoundFX Synthesizer"),
        ("README.md", "Project Overview & 200-Word Approach Write-Up"),
        (".gitignore", "Git Ignore Rules")
    ]

    base_dir = os.getcwd()

    for idx, (rel_path, desc) in enumerate(files_to_include):
        full_path = os.path.join(base_dir, rel_path)
        if not os.path.exists(full_path):
            continue

        with open(full_path, 'r', encoding='utf-8') as f:
            code_content = f.read()

        story.append(Paragraph(f"{idx+1}. {rel_path}", heading_style))
        story.append(Paragraph(f"Description: {desc} | File Path: {rel_path}", meta_style))

        lines = code_content.split('\n')
        wrapped_lines = []
        for line in lines:
            if len(line) > 95:
                chunks = [line[i:i+95] for i in range(0, len(line), 95)]
                wrapped_lines.extend(chunks)
            else:
                wrapped_lines.append(line)

        # Break lines into 50-line chunks so reportlab can flow them across pages cleanly
        chunk_size = 45
        for i in range(0, len(wrapped_lines), chunk_size):
            chunk = "\n".join(wrapped_lines[i:i+chunk_size])
            story.append(Preformatted(chunk, code_style))
            story.append(Spacer(1, 4))

        story.append(Spacer(1, 10))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated: {output_filename}")

if __name__ == "__main__":
    create_code_pdf()
