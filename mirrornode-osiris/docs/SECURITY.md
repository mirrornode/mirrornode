# Security

## Scope and Limitations

Osiris Audit v1.0.0 is **advisory-only software** designed for offline security analysis. It is critical that users understand the following limitations and boundaries:

### What Osiris Is

- **Offline analysis tool** — Operates entirely within the user's browser environment
- **Advisory software** — Provides guidance and insights, not guarantees
- **Self-contained application** — No external dependencies or API calls during operation

### What Osiris Is Not

- **Not a vulnerability scanner** — Does not perform active security testing or exploitation
- **Not a security certification tool** — Results do not constitute compliance or certification
- **Not a SaaS platform** — No cloud services, user accounts, or persistent data storage
- **Not a guarantee** — Advisory findings are informational and subject to interpretation
- **Not a substitute for professional security assessment** — Should be used as one component of a comprehensive security program

## Data Handling

### No Data Transmission

Osiris Audit **does not transmit any data** outside the local browser environment:

- No analytics tracking
- No telemetry collection
- No crash reporting
- No usage statistics
- No external API calls

### No Persistent Storage

Osiris Audit **does not store customer data:**

- No server-side storage
- No cloud database
- No user accounts or authentication
- Browser localStorage may be used for application state only (non-sensitive)

### User Responsibility

Users are responsible for:

- The security of their own systems and browsers
- The confidentiality of any artifacts analyzed using Osiris
- Verifying the integrity of the downloaded application (see checksums)
- Understanding that local browser storage is subject to the browser's security model

## No Warranty

Osiris Audit v1.0.0 is provided **"AS IS"** without warranty of any kind, express or implied, including but not limited to:

- Warranties of merchantability
- Fitness for a particular purpose
- Non-infringement
- Accuracy or completeness of results

## Not a Vulnerability Disclosure Program

This document is **not** a vulnerability disclosure program. Osiris Audit is a product, not a platform or service with ongoing security maintenance.

- There is no bug bounty program
- There is no security response team
- This is a v1.0 product release with defined scope

## Contact

For questions about the scope or intended use of Osiris Audit, please open an issue in the repository using the "Question" template.

For general MIRRORNODE inquiries: Refer to the main repository documentation.

---

**Product:** Osiris Audit v1.0.0  
**Security Model:** Advisory, offline, no data transmission  
**Warranty:** None
