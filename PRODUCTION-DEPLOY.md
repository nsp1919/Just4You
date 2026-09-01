# Just4You Production Deployment

This runbook covers the growth, collaboration, Instagram reaction reward, wallet, and Admin changes completed on 2026-08-29.

## 1. Deploy Source Code

Production deploys from the GitHub `main` branch through Hostinger auto-deploy.

```powershell
git add .
git commit -m "Add growth workflows and secure admin payouts"
git push origin main
```

Do not commit `.env` files, Firebase service-account files, `build/`, `.next/`, or deployment archives.

## 2. Configure Hostinger Environment Variables

Keep the existing Firebase, Razorpay, Resend, and Cloudinary values. Add or verify these values in hPanel before deploying:

```text
NEXT_PUBLIC_SITE_URL=https://just4you.buzz
NEXT_PUBLIC_APP_URL=https://just4you.buzz
NEXT_PUBLIC_BIRTHDAY_APP_URL=<production wish-app origin>
NEXT_PUBLIC_MAIN_APP_URL=https://just4you.buzz
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/<official-page>/

ADMIN_EMAIL=<the authorized Firebase Admin account email>
CRON_SECRET=<new high-entropy random secret>
WALLET_BANK_ENCRYPTION_KEY=<stable random secret of at least 32 characters>
GOOGLE_SITE_VERIFICATION=<Search Console HTML-tag content value>
BING_SITE_VERIFICATION=<Bing msvalidate.01 content value>

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<server-side API key>
CLOUDINARY_API_SECRET=<server-side API secret>

RESEND_API_KEY=<production key>
RESEND_FROM_EMAIL=<verified sender>

RAZORPAY_KEY_ID=<live key>
RAZORPAY_KEY_SECRET=<live secret>
RAZORPAY_WEBHOOK_SECRET=<live webhook secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<live public key>
```

Also retain all `NEXT_PUBLIC_FIREBASE_*` variables and `FIREBASE_SERVICE_ACCOUNT_B64`.

Remove `ADMIN_SECRET` from hPanel. The application no longer accepts it, but deleting the retired secret reduces unnecessary exposure.

Never rotate `WALLET_BANK_ENCRYPTION_KEY` without a data migration. Existing encrypted bank account numbers depend on that key.

## 3. Configure Firebase

1. Enable Email/Password authentication.
2. Add the production web and wish domains to Firebase Authentication authorized domains.
3. Create the authorized Admin Firebase account before launch.
4. Verify `users/{adminUid}` contains:

```json
{
  "role": "admin",
  "isBlocked": false
}
```

5. Ensure the Firebase account email exactly matches `ADMIN_EMAIL`.
6. Deploy the rules:

```powershell
firebase deploy --only firestore:rules
```

The rules protect collaboration tokens, pending contributions, social reward claims, draft-recovery data, occasion reminders, bank withdrawals, wallet settings, and Admin audit logs.

## 4. Configure Scheduled Jobs

This Hostinger plan does not expose Cron Jobs and does not execute `apps/web/vercel.json`. Scheduling is provided by `.github/workflows/scheduled-backend-jobs.yml`.

In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**. Create `CRON_SECRET` and paste the same value configured in Hostinger. Never add the value to the workflow file.

Commit and push the workflow to the default branch. Then open **Actions → Scheduled backend jobs → Run workflow**. A manual run executes all three jobs and each must complete successfully.

The committed UTC schedules are:

- `/api/reminders/run`: daily at 05:10 UTC
- `/api/draft-recovery/run`: daily at 05:40 UTC
- `/api/delivery/run`: hourly at minute 17

A successful Action step prints an HTTP 200 JSON result with `ok: true`. HTTP 401 means the GitHub repository secret does not match Hostinger. GitHub scheduled workflows run only from the default branch and may start a few minutes late during platform load.

## 5. Configure External Services

### Cloudinary

- The image preset must be unsigned and permit browser uploads.
- Reaction rewards do not upload video to Cloudinary.
- A video-capable preset is still required if voice messages, video messages, or contributor audio uploads are enabled.
- Verify only the media upload features you intend to sell.

### Resend

- Verify the sender domain.
- Ensure `RESEND_FROM_EMAIL` belongs to the verified domain.
- Test reminder confirmation, 14/7/2-day reminders, scheduled delivery, draft recovery, and paid-order notifications.

### Razorpay

Register the live webhook:

```text
https://just4you.buzz/api/payment/webhook
```

Use the same value for the Razorpay dashboard webhook secret and `RAZORPAY_WEBHOOK_SECRET`. Enable the payment captured, order paid, payment-link paid, and payment failed events used by the handler.

## 6. Verify Admin Security

Use only:

```text
https://just4you.buzz/admin-access
```

Expected behavior:

- `/admin` redirects to `/admin-access` without a session.
- Customer accounts are denied.
- The authorized Admin receives an eight-hour HTTP-only, Secure, SameSite=Strict session.
- Sensitive Admin APIs require both the Admin session and the matching Firebase bearer token.
- Secure sign-out clears the Admin and Firebase sessions.

## 7. Verify Wallet and Bank Payouts

1. Open Admin > Payouts.
2. Set the minimum bank withdrawal between ₹100 and ₹10,000.
3. Send the reaction video to the official Instagram page by direct message.
4. Submit the sender's Instagram username and featuring consent from the creator dashboard.
5. In Admin > Social, find and review the Instagram direct message.
6. Publish or verify the reaction, then paste its public Instagram Reel/post URL.
7. Approve the claim.
8. Confirm ₹30 is added to both `walletBalance` and `walletWithdrawableBalance`.
9. Submit a bank withdrawal after the Admin-set threshold is reached.
10. Confirm the amount is reserved and only the account suffix is shown to the user.
11. Transfer manually, then mark paid with the bank reference. A rejected request must refund the reserved balance.

Signup wallet bonuses remain non-withdrawable. Only verified referral and approved social-post earnings are cashable.

## 8. Production Smoke Tests

Check these routes after deployment:

```text
/
/pricing
/reminders
/gallery
/mini
/admin-access
/birthday-website-for-girlfriend
/birthday-surprise-for-best-friend
/anniversary-website-for-husband
/online-wedding-invitation
/last-minute-birthday-surprise
```

Also test an authenticated creator flow:

```text
/dashboard
/dashboard/create
/dashboard/collaborate/{celebrationId}
/dashboard/reactions/{celebrationId}
```

And an active recipient flow:

```text
<wish-origin>/wish/{slug}
https://www.instagram.com/<official-page>/
```

## 9. Manual Package Fallback

GitHub auto-deploy is preferred. For a manual package:

```powershell
npm run package:hostinger
```

Upload `just4you-hostinger.tar.gz` and extract it with Linux `tar`, never Windows ZIP extraction.
