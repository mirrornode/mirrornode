import os
import smtplib
from email.message import EmailMessage
import mimetypes

def send_email(to_email: str, subject: str, body: str, attachment_path: str):
    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ['SMTP_USER']
    smtp_pass = os.environ['SMTP_PASS']
    from_email = os.environ.get('SMTP_FROM', smtp_user)

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    msg.set_content(body)

    with open(attachment_path, 'rb') as f:
        data = f.read()
    mime_type, _ = mimetypes.guess_type(attachment_path)
    maintype, subtype = (mime_type or 'application/pdf').split('/')
    msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=os.path.basename(attachment_path))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
