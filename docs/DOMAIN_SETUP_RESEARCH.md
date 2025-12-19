# Domain Setup Research: Vercel + Resend Integration

This document researches the best patterns for quickly and easily setting up a custom domain for Vercel-hosted apps with Resend email verification.

## Priority Criteria
1. **Cheap** - Lowest cost for domain registration and renewal
2. **Easy** - Minimal steps, fast setup, good UX
3. **Resend Compatible** - Ability to add DNS records for email verification

---

## Executive Summary: Recommended Pattern

### 🏆 Best Overall: **Buy Domain Directly from Vercel**

For users of this template, **buying a domain directly through Vercel** is the recommended approach because:

| Factor | Rating | Notes |
|--------|--------|-------|
| **Cost** | ⭐⭐⭐⭐ | At-cost pricing (~$10.44 for .com), no markup |
| **Ease** | ⭐⭐⭐⭐⭐ | Instant connection to project, zero DNS config for hosting |
| **Resend** | ⭐⭐⭐⭐ | Easy to add TXT/MX records via Vercel DNS panel |

**Alternative:** Cloudflare Registrar for power users who want the absolute cheapest option and are comfortable with DNS management.

---

## Option Comparison

### Option 1: Vercel Domains (Recommended)

**Pricing:**
- At-cost pricing (no markup) - partnered with name.com
- .com domains: ~$10-11/year
- Up to 50% savings on popular TLDs vs competitors
- WHOIS privacy included free

**Pros:**
- ✅ **Instant project connection** - domain auto-connects to your Vercel project
- ✅ **No DNS configuration for hosting** - A/CNAME records auto-configured
- ✅ **Same dashboard** - manage hosting + domain in one place
- ✅ **Bulk checkout** - buy multiple domains at once
- ✅ **Easy Resend setup** - add TXT/MX records through Vercel DNS panel

**Cons:**
- ❌ Slightly higher than Cloudflare (at-cost vs at-cost, both are cheap)
- ❌ Fewer TLD options than Namecheap

**Setup Time:** ~5 minutes

### Option 2: Cloudflare Registrar

**Pricing:**
- True at-cost pricing (Cloudflare makes $0 profit)
- .com domains: ~$10.44/year (cheapest available)
- WHOIS privacy included free

**Pros:**
- ✅ **Absolute lowest prices** - no markup whatsoever
- ✅ **Excellent DNS management** - Cloudflare's DNS is industry-leading
- ✅ **Free CDN/security** - DDoS protection, WAF included
- ✅ **Domain Connect support** - one-click Resend DNS setup

**Cons:**
- ❌ **DNS lock-in** - must use Cloudflare's nameservers
- ❌ **Extra step** - need to configure DNS to point to Vercel
- ❌ **Two dashboards** - Cloudflare for DNS, Vercel for hosting

**Setup Time:** ~15-20 minutes

### Option 3: Porkbun

**Pricing:**
- .com domains: ~$11.08/year (registration and renewal same price)
- WHOIS privacy included free
- Free SSL certificates

**Pros:**
- ✅ **Transparent pricing** - no first-year discount traps
- ✅ **Phone support** - rare at this price point
- ✅ **Flexible** - can use any nameservers

**Cons:**
- ❌ Extra DNS configuration required
- ❌ No Domain Connect support (manual Resend setup)

**Setup Time:** ~15-20 minutes

### Option 4: Namecheap

**Pricing:**
- .com domains: ~$6.49 first year, **~$16.98 renewal** ⚠️
- WHOIS privacy included free

**Pros:**
- ✅ **Cheap first year** - great for testing
- ✅ **Widest TLD selection** (539 TLDs)
- ✅ **24/7 customer support**

**Cons:**
- ❌ **High renewal prices** - trap for long-term cost
- ❌ Extra DNS configuration required

**Setup Time:** ~15-20 minutes

---

## Resend DNS Requirements

To verify a domain with Resend for email sending, you need to add these DNS records:

### Required Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| **TXT** | `resend._domainkey` | (DKIM key from Resend dashboard) | Email signature verification |
| **TXT** | `send` (or subdomain) | `"v=spf1 include:amazonses.com ~all"` | Sender authorization |
| **MX** | `send` (or subdomain) | `feedback-smtp.us-east-1.amazonses.com` (priority: 10) | Bounce handling |

### Optional Record

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| **TXT** | `_dmarc` | `"v=DMARC1; p=none;"` | Additional email trust |

### Best Practice: Use a Subdomain

Resend recommends using a subdomain like `send.yourdomain.com` or `mail.yourdomain.com` instead of the root domain. This:
- Protects your root domain's email reputation
- Allows separate email configurations
- Is easier to manage

**Example:** Instead of `no-reply@yourdomain.com`, use `no-reply@send.yourdomain.com`

---

## Step-by-Step Setup Guide

### Method 1: Vercel Domain (Recommended)

#### Step 1: Buy Domain from Vercel
1. Go to [vercel.com/domains](https://vercel.com/domains)
2. Search for your desired domain name
3. Add to cart and purchase
4. Domain is automatically added to your Vercel account

#### Step 2: Connect to Your Project
1. In your Vercel project, go to **Settings** → **Domains**
2. Select your newly purchased domain
3. Vercel automatically configures the DNS for hosting

#### Step 3: Add Resend DNS Records
1. Go to [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Enter your domain (e.g., `send.yourdomain.com`)
3. Resend will show you the required DNS records
4. In Vercel, go to your domain → **DNS Records**
5. Add each record from Resend:

   **TXT Record (DKIM):**
   - Name: `resend._domainkey.send` (adjust for your subdomain)
   - Type: TXT
   - Value: (copy from Resend)

   **TXT Record (SPF):**
   - Name: `send`
   - Type: TXT
   - Value: `v=spf1 include:amazonses.com ~all`

   **MX Record:**
   - Name: `send`
   - Type: MX
   - Value: `feedback-smtp.us-east-1.amazonses.com`
   - Priority: 10

6. Return to Resend and click **Verify DNS Records**
7. Wait for verification (usually 5-60 minutes, can take up to 24 hours)

#### Step 4: Update Environment Variables
```bash
# In Vercel Environment Variables
MAIL_FROM="Your App <no-reply@send.yourdomain.com>"
APP_BASE_URL="https://yourdomain.com"
```

### Method 2: Cloudflare with Domain Connect (Power Users)

#### Step 1: Buy Domain from Cloudflare
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Domain Registration** → **Register Domains**
3. Search and purchase your domain

#### Step 2: Configure DNS for Vercel
1. In Cloudflare DNS settings, add:
   - **A Record:** `@` → `76.76.21.21`
   - **CNAME:** `www` → `cname.vercel-dns.com`

2. Set proxy status to **DNS Only** (gray cloud) for Vercel compatibility

#### Step 3: Add Domain to Vercel
1. In Vercel, go to **Settings** → **Domains** → **Add**
2. Enter your domain
3. Verify ownership (Vercel will provide instructions)

#### Step 4: Add Resend DNS Records
1. In Resend, add your domain
2. If Cloudflare supports Domain Connect for Resend, click **Auto-configure** (one-click setup!)
3. Otherwise, manually add the records in Cloudflare DNS panel

---

## Cost Comparison (5-Year Total Cost for .com)

| Registrar | Year 1 | Year 2-5 | **5-Year Total** |
|-----------|--------|----------|------------------|
| Cloudflare | $10.44 | $10.44/yr | **$52.20** |
| Vercel | ~$10.50 | ~$10.50/yr | **~$52.50** |
| Porkbun | $11.08 | $11.08/yr | **$55.40** |
| Namecheap | $6.49 | $16.98/yr | **$74.41** ⚠️ |

---

## FAQ

### Q: Can I use the free *.vercel.app domain with Resend?
**No.** Resend requires you to own and verify a custom domain. You cannot add DNS records to Vercel's shared subdomain.

### Q: How long does Resend verification take?
Usually 5-60 minutes, but DNS propagation can take up to 24 hours. If verification fails after 72 hours, check your records for typos.

### Q: Should I use root domain or subdomain for email?
**Use a subdomain** like `send.yourdomain.com` or `mail.yourdomain.com`. This is the industry best practice and protects your root domain's email reputation.

### Q: What if I already own a domain elsewhere?
You can either:
1. **Transfer to Vercel** - Vercel supports domain transfers
2. **Keep external** - Point nameservers to Vercel or add A/CNAME records
3. **Use Cloudflare** - Put Cloudflare in front (proxy mode) for free CDN

### Q: What's the absolute cheapest path?
Cloudflare Registrar with manual DNS setup is the cheapest, but requires more configuration. For most users, Vercel's convenience is worth the negligible price difference.

---

## Recommendation Matrix

| User Type | Recommended Option | Why |
|-----------|-------------------|-----|
| **New to web dev** | Vercel Domains | Simplest setup, one dashboard |
| **Budget conscious** | Cloudflare | Absolute lowest prices |
| **Already using Cloudflare** | Cloudflare | Leverage existing setup |
| **Need lots of TLDs** | Namecheap | Widest selection |
| **Want phone support** | Porkbun | Only cheap registrar with phones |

---

## Sources

- [Vercel Domains - Buy a Domain](https://vercel.com/docs/getting-started-with-vercel/buy-domain)
- [Vercel Domains At-Cost Pricing Announcement](https://vercel.com/changelog/vercel-domains-at-cost-pricing-and-the-fastest-on-the-web)
- [Resend Domain Verification Documentation](https://resend.com/docs/dashboard/domains/introduction)
- [Resend + Vercel Integration Guide](https://resend.com/docs/knowledge-base/vercel)
- [Vercel DNS Management](https://vercel.com/docs/domains/managing-dns-records)
- [Resend New Domains Workflow (Domain Connect)](https://resend.com/changelog/new-domains-workflow)
- [Cloudflare vs Namecheap vs Porkbun Comparison](https://techbullion.com/cloudflare-registrar-vs-namecheap-vs-porkbun-a-comprehensive-comparison/)
