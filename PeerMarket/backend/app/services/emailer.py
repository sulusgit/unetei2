import smtplib
from email.message import EmailMessage
from typing import List, Tuple
import os

FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@peermarket.local")
SMTP_HOST  = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "25"))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")

def send_email(to_addr: str, subject: str, html_body: str, text_body: str = "") -> None:
    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"]   = to_addr
    msg["Subject"] = subject
    if text_body:
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")
    else:
        msg.set_content("This email requires an HTML capable client.")
        msg.add_alternative(html_body, subtype="html")

    if SMTP_USER:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.send_message(msg)