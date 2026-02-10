# POV Cam — Storage Provider Comparison

## 1. POV Cam's Storage Profile

Before comparing providers, let's define the workload precisely. POV Cam is **write-heavy on ingest, read-heavy on egress, and short-lived per event**.

| Characteristic | Detail |
|---|---|
| Write pattern | Bursty. 200 guests uploading 15 photos each within a 4-6 hour window. |
| Read pattern | Thumbnails served frequently (guests + organizer). Originals downloaded once (organizer bulk download). |
| File sizes | Originals: 1-5 MB (compressed JPEG). Thumbnails: 30-80 KB. |
| Retention | Active for ~7-30 days per event. Archived/purged after. |
| Access control | Private buckets. All access via signed URLs. No public files. |
| S3 compatibility needed | Yes. Signed upload URLs and signed download URLs are the core mechanism. |
| CDN value | High for thumbnails (served repeatedly). Low for originals (downloaded once). |

### Modeled Scenarios

**Small (MVP validation):** 10 events/month, 200 guests, 15 uploads each = 30,000 photos.
**Medium (early traction):** 50 events/month = 150,000 photos.
**Large (scale):** 200 events/month = 600,000 photos.

Per photo: ~2 MB original + ~50 KB thumbnail.

| Scenario | New Storage/Month | Cumulative (3 mo avg) | Egress/Month |
|---|---|---|---|
| Small (10 events) | 60 GB | ~120 GB | ~66 GB |
| Medium (50 events) | 300 GB | ~600 GB | ~330 GB |
| Large (200 events) | 1.2 TB | ~2.4 TB | ~1.3 TB |

Egress breakdown: Guest thumbnail views (~2.5%), organizer gallery browsing (~7%), organizer bulk download (~90%).

---

## 2. Provider Pricing at a Glance

| | **Supabase Storage** | **Cloudflare R2** | **AWS S3 Standard** | **DigitalOcean Spaces** | **Backblaze B2** | **Wasabi** |
|---|---|---|---|---|---|---|
| **Storage/GB/month** | $0.021 | $0.015 | $0.023 | $0.02 | $0.006 | $0.0069 |
| **Egress/GB** | $0.09 (uncached), $0.03 (cached) | **$0** | $0.09 | $0.01 (after 1 TB free) | Free up to 3× storage, then $0.01 | Free if egress ≤ storage volume |
| **Upload operations (per 1M)** | Included | $4.50 | $5.00 | Included | Free | Free |
| **Download operations (per 1M)** | Included | $0.36 | $0.40 | Included | $0.004/1K | Free |
| **Free tier** | 1 GB (with free plan) / 100 GB (with Pro $25/mo) | 10 GB storage, 10M reads, 1M writes | 5 GB (12 months only) | 250 GB + 1 TB egress (in $5/mo base) | 10 GB storage | None (1 TB minimum charge) |
| **Minimum charge** | None (beyond plan) | None | None | $5/month | None | **$6.99/month** (1 TB min) |
| **Minimum retention** | None | None | None | None | None | **90 days** |
| **Signed upload URLs** | Yes (native SDK) | Yes (S3 presigned) | Yes (S3 presigned) | Yes (S3 presigned) | Yes (S3 presigned) | Yes (S3 presigned) |
| **Built-in CDN** | Supabase CDN (limited) | **Cloudflare global CDN** | CloudFront (separate cost) | **Built-in Spaces CDN** | Via Cloudflare partnership (free egress) | No |
| **S3 API compatible** | Via S3 compat mode (alpha) | Yes | Yes (native) | Yes | Yes | Yes |

---

## 3. Cost Comparison by Scenario

### Small: 10 events/month (120 GB storage, 66 GB egress)

| Provider | Storage | Egress | Operations | Base/Min Fee | **Total** |
|---|---|---|---|---|---|
| **Supabase** (Pro plan) | $0.42 overage (20 GB over 100 GB included) | $0 (within 250 GB included) | Included | $25.00 | **$25.42** |
| **Cloudflare R2** | $1.65 (110 GB × $0.015) | $0 | ~$1.00 | $0 | **$2.65** |
| **AWS S3** | $2.76 | $0 (within 100 GB free) | ~$0.60 | $0 | **$3.36** |
| **DO Spaces** | $0 (within 250 GB) | $0 (within 1 TB) | Included | $5.00 | **$5.00** |
| **Backblaze B2** | $0.66 (110 GB × $0.006) | $0 (66 GB < 3×120 GB) | ~$0.10 | $0 | **$0.76** |
| **Wasabi** | N/A | N/A | N/A | $6.99 (1 TB min) | **$6.99** |

### Medium: 50 events/month (600 GB storage, 330 GB egress)

| Provider | Storage | Egress | Operations | Base/Min Fee | **Total** |
|---|---|---|---|---|---|
| **Supabase** (Pro plan) | $10.50 (500 GB over) | $7.20 (80 GB over 250 GB) | Included | $25.00 | **$42.70** |
| **Cloudflare R2** | $8.85 (590 GB × $0.015) | $0 | ~$4.00 | $0 | **$12.85** |
| **AWS S3** | $13.80 | $20.70 (230 GB × $0.09) | ~$3.00 | $0 | **$37.50** |
| **DO Spaces** | $7.00 (350 GB over × $0.02) | $0 (within 1 TB) | Included | $5.00 | **$12.00** |
| **Backblaze B2** | $3.54 (590 GB × $0.006) | $0 (330 < 3×600) | ~$0.50 | $0 | **$4.04** |
| **Wasabi** | $6.99 (within 1 TB min) | $0 (330 < 600) | Free | $0 | **$6.99** |

### Large: 200 events/month (2.4 TB storage, 1.3 TB egress)

| Provider | Storage | Egress | Operations | Base/Min Fee | **Total** |
|---|---|---|---|---|---|
| **Supabase** (Pro plan) | $48.30 (2.3 TB over) | $94.50 (1.05 TB over) | Included | $25.00 | **$167.80** |
| **Cloudflare R2** | $35.85 (2.39 TB × $0.015) | $0 | ~$15.00 | $0 | **$50.85** |
| **AWS S3** | $55.20 | $108.00 (1.2 TB × $0.09) | ~$12.00 | $0 | **$175.20** |
| **DO Spaces** | $43.00 (2.15 TB over × $0.02) | $3.00 (0.3 TB over × $0.01) | Included | $5.00 | **$51.00** |
| **Backblaze B2** | $14.10 (2.39 TB × $0.006) | $0 (1.3 < 3×2.4) | ~$2.00 | $0 | **$16.10** |
| **Wasabi** | $16.54 (2.4 TB × $0.0069) | $0 (1.3 < 2.4) | Free | $0 | **$16.54** |

---

## 4. Integration Effort & Developer Experience

This is where the real cost lives — not in monthly bills at MVP, but in hours spent integrating and maintaining.

### Supabase Storage

**Integration effort: Very Low (2-4 hours)**

- Already in your stack (Supabase Postgres is your DB).
- Single SDK for both DB and storage: `@supabase/supabase-js`.
- `createSignedUploadUrl()` and `createSignedUrl()` are single-line calls.
- No separate credentials, IAM policies, bucket policies, or CORS to configure.
- Storage metadata tracked automatically in `storage.objects` table within your Postgres instance.
- Dashboard for visual bucket management and debugging.

**Drawbacks:**
- S3 compatibility is in alpha — some S3 tooling may not work perfectly.
- Egress costs scale poorly for your use case.
- You're coupling storage to your DB provider. If you leave Supabase Postgres later, you lose the tight integration.

### Cloudflare R2

**Integration effort: Low-Medium (4-8 hours)**

- S3-compatible. Use `@aws-sdk/client-s3` with R2's endpoint URL.
- Presigned URLs work the same as S3: `PutObject` for uploads, `GetObject` for downloads.
- Need to create a Cloudflare account, set up R2 bucket, generate API tokens.
- CORS configuration required on the bucket (for direct browser uploads).
- No native SDK integration with Supabase — your API server talks to two separate services (Supabase for DB, R2 for storage).
- Cloudflare dashboard for bucket management.

**What you gain:**
- Zero egress. This is the single biggest advantage for your workload.
- Cloudflare's global CDN automatically caches read requests. Thumbnails served from edge.
- Very mature S3 compatibility. Tooling just works.

**Drawbacks:**
- Two separate systems to manage credentials and configuration for.
- No built-in relationship between storage and your DB. You manage path consistency yourself (which you're already doing with the `media` table).

### AWS S3

**Integration effort: Medium (6-12 hours)**

- Industry standard. `@aws-sdk/client-s3` is the canonical SDK.
- Presigned URLs are well-documented and battle-tested.
- Need an AWS account, IAM user/role, bucket policy, CORS config.
- IAM policy management is notoriously complex for newcomers.
- Bucket policies + IAM + CORS is a three-layer configuration that can be confusing.
- If you want CDN, add CloudFront as a separate service (additional configuration, cost, and complexity).

**What you gain:**
- Maximum flexibility and ecosystem. Every tool supports S3 natively.
- Most robust storage service in existence. 11 nines durability.
- Advanced features (lifecycle policies, intelligent tiering, event notifications via Lambda).

**Drawbacks:**
- Egress is expensive ($0.09/GB) and is the primary cost driver at scale.
- Configuration complexity is the highest of all options.
- Three systems to manage (Supabase for DB, S3 for storage, optionally CloudFront for CDN).

### DigitalOcean Spaces

**Integration effort: Low-Medium (4-8 hours)**

- S3-compatible. Use `@aws-sdk/client-s3` with DO's endpoint.
- Built-in CDN included at no extra cost. Enable per-bucket.
- Simple dashboard, straightforward bucket creation.
- CORS configuration needed but simpler than AWS.
- Flat $5/month base makes cost very predictable.

**What you gain:**
- Simple, predictable pricing. No egress surprise up to 1 TB.
- Built-in CDN for thumbnail serving.
- Good S3 compatibility.

**Drawbacks:**
- Fewer regions than AWS/Cloudflare (limited to DO data centers).
- 1 TB egress included, then $0.01/GB — cheap but not zero.
- Less ecosystem tooling than AWS S3.
- If you're not already in the DO ecosystem, it's another account/provider to manage.

### Backblaze B2

**Integration effort: Low-Medium (4-8 hours)**

- S3-compatible. Use `@aws-sdk/client-s3` with B2's endpoint.
- Presigned URLs work as expected.
- Free egress up to 3× monthly storage — very generous for your use case (at 600 GB storage, you get 1.8 TB free egress).
- Free egress via Cloudflare partnership (unlimited, if you put Cloudflare CDN in front).
- Dashboard is basic but functional.

**What you gain:**
- Cheapest storage per GB ($0.006/GB) by a wide margin.
- Extremely generous free egress policy.
- With Cloudflare CDN in front: effectively zero egress + global CDN. Best of both worlds.

**Drawbacks:**
- Fewer regions (US and EU only for most plans).
- Less mainstream than S3/R2 — slightly more risk of edge-case S3 compat issues.
- API rate limits may be tighter for burst workloads (200 concurrent uploads).
- Smaller community and fewer integration examples.

### Wasabi

**Integration effort: Low-Medium (4-8 hours)**

- S3-compatible. Use `@aws-sdk/client-s3`.
- No egress fees (if egress ≤ storage volume — fits your use case).
- No API request fees.

**What you gain:**
- Very cheap at large storage volumes.
- Truly predictable cost — flat rate, no per-request or per-egress charges.

**Drawbacks:**
- **1 TB minimum monthly charge ($6.99/month).** At small scale (10 events, 120 GB storage), you're paying for 880 GB you're not using. Not ideal for MVP.
- **90-day minimum storage retention.** This is a serious problem for POV Cam. Your events are short-lived. If an event is archived and purged after 30 days, you still pay for 60 more days of storage on every file. This directly conflicts with your data retention model.
- Egress policy has a "reasonable use" clause — if Wasabi decides your access pattern is too egress-heavy, they can throttle or suspend you. Less predictable than R2's absolute zero.
- No built-in CDN.

---

## 5. Weighted Scoring for POV Cam

Scoring on a 1-5 scale, weighted by importance to your specific use case.

| Criteria (Weight) | Supabase | R2 | S3 | DO Spaces | B2 | Wasabi |
|---|---|---|---|---|---|---|
| **Cost at Small scale** (15%) | 3 | 5 | 4 | 4 | 5 | 2 |
| **Cost at Medium scale** (15%) | 2 | 4 | 3 | 4 | 5 | 4 |
| **Cost at Large scale** (15%) | 1 | 4 | 1 | 4 | 5 | 5 |
| **Integration with Supabase DB** (20%) | 5 | 3 | 3 | 3 | 3 | 3 |
| **Developer experience** (10%) | 5 | 4 | 3 | 4 | 3 | 3 |
| **CDN / edge performance** (10%) | 2 | 5 | 3 (needs CloudFront) | 4 | 4 (via Cloudflare) | 1 |
| **Fit for short-lived data** (10%) | 5 | 5 | 5 | 5 | 5 | 1 |
| **S3 ecosystem compat** (5%) | 2 | 5 | 5 | 4 | 4 | 4 |
| **Weighted Score** | **3.55** | **4.15** | **3.05** | **3.85** | **4.15** | **2.95** |

---

## 6. Recommendation

### MVP (Stage 1): Supabase Storage

**Despite not winning on cost or score, use Supabase Storage for MVP.**

Rationale: The 20% weight on integration isn't just about hours — it's about cognitive overhead. At MVP, you're one developer (or a tiny team) building the entire product. Having one SDK, one dashboard, one set of credentials, one billing relationship reduces decision fatigue and debugging surface area dramatically. The cost difference at 10 events/month is ~$22/month vs Backblaze. That's not worth the added infrastructure complexity when you're still validating the product.

### Stage 2 (Early Traction): Cloudflare R2 or Backblaze B2 + Cloudflare CDN

**Two equally strong options. Choose based on your preference:**

**Option A — Cloudflare R2:**
- Zero egress, built-in CDN, excellent S3 compat.
- Simpler architecture (one provider for storage + CDN).
- Slightly higher storage cost than B2 ($0.015 vs $0.006/GB).

**Option B — Backblaze B2 + Cloudflare CDN:**
- Cheapest overall. B2's $0.006/GB storage + free egress via Cloudflare partnership.
- Requires two providers (B2 for storage, Cloudflare for CDN), but they have a formal integration.
- Best for cost-optimization if you're processing high volumes.

At 50 events/month, Option A costs ~$13/month, Option B costs ~$4/month. At 200 events/month, Option A costs ~$51/month, Option B costs ~$16/month.

### Stage 3 (Scale): Backblaze B2 + Cloudflare CDN

At high volume, B2's storage pricing advantage compounds. With Cloudflare CDN in front serving thumbnails from edge cache, your actual B2 egress is minimal (only cache misses and bulk downloads). This combination gives you the lowest possible TCO while maintaining global performance.

### Eliminate From Consideration

- **AWS S3:** No advantage over R2 for your use case. Higher egress, more complexity, no benefit.
- **Wasabi:** The 90-day minimum retention is a deal-breaker for event-based short-lived storage. The 1 TB minimum charge hurts at small scale. Egress policy has ambiguous "reasonable use" language.

### Critical Implementation Note

Regardless of which provider you use, **abstract storage behind an interface from day one:**

```typescript
interface StorageProvider {
  generateUploadUrl(bucket: string, path: string, contentType: string, expiresIn?: number): Promise<string>;
  generateDownloadUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
  deleteObject(bucket: string, path: string): Promise<void>;
  deletePrefix(bucket: string, prefix: string): Promise<void>;
  headObject(bucket: string, path: string): Promise<{ size: number; contentType: string } | null>;
}
```

This abstraction costs 2-3 hours of work now. It makes the Supabase → R2 migration a config change + new class implementation, not a codebase-wide refactor.
