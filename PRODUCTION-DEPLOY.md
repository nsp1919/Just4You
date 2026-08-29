# Just4You Production Deployment

This runbook covers the growth, collaboration, reaction-recording, wallet, and Admin changes completed on 2026-08-29.

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

ADMIN_EMAIL=<the authorized Firebase Admin account email>
CRON_SECRET=<new high-entropy random secret>
WALLET_BANK_ENCRYPTION_KEY=<stable random secret of at least 32 characters>

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=birthdayglow_unsigned
NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET=<unsigned video-capable preset>

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

The rules protect collaboration tokens, pending contributions, reaction recordings, reward claims, draft-recovery data, occasion reminders, bank withdrawals, wallet settings, and Admin audit logs.

## 4. Configure Scheduled Jobs

Hostinger does not execute `apps/web/vercel.json`. Create these external cron commands against the main production origin:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://just4you.buzz/api/reminders/run
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://just4you.buzz/api/draft-recovery/run
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://just4you.buzz/api/delivery/run
```

Recommended schedules:

- `/api/reminders/run`: daily at 06:00 UTC
- `/api/draft-recovery/run`: daily at 06:30 UTC
- `/api/delivery/run`: hourly

A successful request returns HTTP 200 with an `ok` result. HTTP 401 means the bearer secret does not match.

## 5. Configure External Services

### Cloudinary

- The image preset must be unsigned and permit browser uploads.
- The video preset must accept video/audio uploads used by reactions, voice messages, and contributor recordings.
- Verify uploads to the configured contribution, reaction, social-proof, and review folders.

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
3. Submit a consented reaction recording from an active wish page.
4. Post the branded reaction to Instagram or WhatsApp Status.
5. Submit posting proof from the creator dashboard.
6. In Admin > Social, inspect both the reaction and posting evidence.
7. Approve the claim.
8. Confirm ₹25 is added to both `walletBalance` and `walletWithdrawableBalance`.
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
https://just4you.buzz/reaction/{celebrationId}
```

## 9. Manual Package Fallback

GitHub auto-deploy is preferred. For a manual package:

```powershell
npm run package:hostinger
```

Upload `just4you-hostinger.tar.gz` and extract it with Linux `tar`, never Windows ZIP extraction.
