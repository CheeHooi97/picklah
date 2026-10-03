# PickLah subscriptions

## Product rules

- Guests and registered users create, edit, import, spin, and keep drafts on their devices. No wheel database writes occur for these actions.
- An authenticated subscriber explicitly sharing a wheel creates a database snapshot and public URL.
- Recipients can open public URLs without subscribing.
- Existing published snapshots remain accessible; cancellation prevents publishing new snapshots. Retention policy can be changed separately.
- Account and billing records are separate from wheel content. Registration must not automatically upload drafts.

## Selected providers

- Website: Stripe Billing with hosted Checkout in subscription mode and Customer Portal for subscription management.
- Capacitor Android/iOS: RevenueCat purchases, offerings, restore purchases, and an entitlement named `picklah_share` (configurable).
- Both use the same stable authenticated account ID. Do not use emails or a client-supplied user ID as proof of ownership.
- Consumer authentication now uses PickLah username/password accounts and verified Google identities with server sessions. Use `picklah_accounts.id` as the shared billing identity. Existing company appId/appKey authentication is not consumer login.

## Backend implementation required

1. Resolve the consumer session cookie through AuthService.Current and derive its account ID on the server.
2. Add server-owned billing customer mappings and subscription entitlement records. Add the subscriber owner ID to newly published wheels.
3. Create Stripe Checkout sessions for the configured price, associating the authenticated account with Stripe customer/subscription metadata. Use configured redirect URLs, never arbitrary client URLs.
4. Verify Stripe webhook signatures against the raw body; deduplicate events. Reconcile current subscription state so delayed events do not restore expired access. A success redirect alone must never unlock sharing.
5. Identify RevenueCat users with the same account ID after login. Check the configured entitlement using RevenueCat's server API; authenticate webhook requests and reconcile current entitlement status. Handle expiration, refund, cancellation, and restoration.
6. Expose authenticated account capabilities to the frontend. POST /v1/wheels must verify current entitlement before calling the wheel publication service. Neither headers claiming a plan nor local storage can grant access.
7. Keep billing failures and unavailable provider checks closed to new publication, preserving the local draft.

## Configuration checklist

Keep secret values in the ignored backend `.env`, never in frontend VITE variables:

```dotenv
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
REVENUECAT_SECRET_API_KEY=
REVENUECAT_ENTITLEMENT_ID=picklah_share
PICKLAH_PUBLIC_URL=
```

Native RevenueCat public SDK keys are platform-specific. Configure matching App Store / Google Play subscription products and offerings in RevenueCat. See AUTH_SETUP.md for Google client configuration.

## Current implementation status

Device-only drafts and consumer login now work. POST /v1/wheels returns SUBSCRIPTION_REQUIRED before database publication, and the frontend explains the requirement. This is a temporary closed gate: Stripe checkout, RevenueCat purchases, and verified subscriber sharing are not implemented yet. Existing shared-wheel reads are retained. Provider selection does not by itself activate subscriptions.

## References

- [Stripe subscription Checkout](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [RevenueCat user identity](https://www.revenuecat.com/docs/customers/identifying-customers)
- [RevenueCat subscription status](https://www.revenuecat.com/docs/customers/customer-info)
- [RevenueCat server API](https://www.revenuecat.com/docs/api-v1)
