# Privacy policy update — admin dashboard / data visibility

The new admin dashboard (`worker/src/admin.ts`, served at `/admin`) lets the operator view
aggregate account data: **email address, number of prompts, and total prompt storage**. The
email and prompt content were already collected for cloud sync; what's newly disclosed is that
an operator can view this data in aggregate for administration.

**The privacy policy is not in this repo** — it's hosted on `aipromptgenius.app`. Apply the
copy below to the two places outside this codebase.

---

## 1. Hosted privacy policy (aipromptgenius.app)

Add or extend an "Information we collect" / "How we use it" section:

> **Account and sync data.** When you create an account and enable cloud sync, we store your
> email address and the prompts and folders you save so we can sync them across your devices. 
> Account creation & syncing are optional and can be disabled at anytime. 
>
> **Administration.** Our administrators may view aggregate account information — including your
> email address, the number of prompts you have saved, and the approximate storage your prompts
> occupy — for the purposes of operating, maintaining, securing, and supporting the service.
>
> We do not sell your data or your prompts, and we do not use your prompt content for advertising.

## 2. Chrome Web Store — Data safety / privacy practices

In the Web Store Developer Dashboard → your item → **Privacy** tab, make sure the data-collection
disclosure declares (if not already):

- **Personally identifiable information** — email address (collected, used for account/sync).
- **User content** — the prompts users save (collected, used to sync across devices).

Confirm the "Privacy policy URL" field points at the updated policy above.

---

_Context: this accompanies the admin dashboard + backend-driven promos change. See the plan at
`~/.claude/plans/can-you-make-an-expressive-acorn.md`._
