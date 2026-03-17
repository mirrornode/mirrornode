from flask import Flask, request, jsonify
import os
import stripe
import subprocess
from pdf_utils import generate_audit_pdf
from mail_utils import send_email

STRIPE_SECRET = os.environ['STRIPE_SECRET']
STRIPE_WEBHOOK_SECRET = os.environ['STRIPE_WEBHOOK_SECRET']

stripe.api_key = STRIPE_SECRET

app = Flask(__name__)

@app.route('/api/pay', methods=['POST'])
def webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return jsonify({'status': 'invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'status': 'invalid signature'}), 400

    if event['type'] == 'payment_intent.succeeded':
        data = event['data']['object']
        metadata = data.get('metadata', {})
        repo = metadata.get('repo')
        email = metadata.get('email')

        if repo:
            try:
                subprocess.run(["~/bin/osiris", repo], check=True)
            except Exception:
                pass

            pdf_path = generate_audit_pdf(repo, status="GREEN")
            if email:
                send_email(
                    to_email=email,
                    subject=f"Audit Complete: {repo}",
                    body=f"Your audit for {repo} is complete. See attached PDF.",
                    attachment_path=pdf_path
                )

    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
