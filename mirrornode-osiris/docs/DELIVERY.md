# Delivery

## Osiris Audit v1.0.0 Customer Flow

This document describes how Osiris Audit v1.0.0 is delivered to customers.

---

## Purchase

### Stripe Payment Link

Osiris Audit is purchased through a **Stripe Payment Link**:

- **No account creation required**
- **One-time payment**
- Secure payment processing via Stripe
- Receipt emailed automatically

### What You Receive

After successful payment, customers receive:

1. **Payment confirmation email** from Stripe
2. **Secure download link** (time-limited)
3. **Checksum for verification**

---

## Download

### Secure, Time-Limited Access

The download link provided after purchase is:

- **Time-limited** — Valid for a limited period (typically 24-48 hours)
- **Secure** — Cryptographically signed and scoped to your transaction
- **Direct download** — No login or account portal required

### No Persistent Entitlement

Important characteristics:

- **No ongoing account** — There is no user account or dashboard
- **No entitlement tracking** — Download links expire; access is not "forever"
- **Single product delivery** — This is a software artifact delivery, not a subscription

**Recommendation:** Download and archive your copy immediately upon receipt.

---

## Verification

### Integrity Check

After downloading Osiris Audit, verify the file integrity using the provided checksum:

**SHA-256:**
```
eaf6f678a42765d44e80e1f7200f0045f10e17e1198f799c294a853d328f7bcf
```

**Verification command (example):**
```bash
# macOS/Linux
shasum -a 256 osiris-audit-v1.0.0.zip

# Windows (PowerShell)
Get-FileHash osiris-audit-v1.0.0.zip -Algorithm SHA256
```

The output should **exactly match** the checksum above.

For full checksum documentation, see: [`CHECKSUMS.md`](CHECKSUMS.md)

---

## Support

### No Ongoing Support Subscription

Osiris Audit v1.0.0 is delivered as-is:

- **No dedicated support team**
- **No SLA or uptime guarantees** (because there is no service)
- **No version updates or patches** included in the purchase

### Community & Questions

For questions about the product:

- Open an issue in the [mirrornode/mirrornode repository](https://github.com/mirrornode/mirrornode/issues)
- Use the **"Question"** issue template
- Community-driven responses (no guaranteed response time)

---

## What This Is Not

- **Not a SaaS subscription** — No recurring billing, no cloud platform
- **Not a license server** — No phone-home, no activation, no DRM
- **Not an entitlement system** — No ongoing access portal or account management
- **Not a support contract** — No professional services or dedicated support included

---

## Summary

| **Aspect**              | **Details**                                    |
|--------------------------|------------------------------------------------|
| **Purchase**             | One-time payment via Stripe                   |
| **Delivery**             | Secure, time-limited download link            |
| **Account**              | None required                                 |
| **Entitlement**          | Expires after download window                 |
| **Integrity**            | SHA-256 checksum provided                     |
| **Support**              | Community-driven via GitHub Issues            |
| **Updates**              | Not included in v1.0.0 purchase               |

---

**Product:** Osiris Audit v1.0.0  
**Delivery Model:** Direct download, no persistent entitlement  
**Support Model:** Community-driven, no SLA
