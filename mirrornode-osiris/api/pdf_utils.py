from reportlab.pdfgen import canvas
from datetime import datetime
import os

def generate_audit_pdf(repo: str, status: str = "GREEN", filename: str = None) -> str:
    if filename is None:
        safe = repo.replace('/', '-')
        filename = os.path.join("/tmp", f"{safe}-audit.pdf")

    c = canvas.Canvas(filename)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 750, f"Audit Report: {repo}")
    c.setFont("Helvetica", 12)
    c.drawString(100, 730, f"Status: {status}")
    c.drawString(100, 710, f"Generated: {datetime.utcnow().isoformat()}Z")
    c.showPage()
    c.save()
    return filename
