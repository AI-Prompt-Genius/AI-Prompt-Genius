# AI Prompt Genius — OpenAI listing draft

Portal: https://platform.openai.com/plugins/manage/plugin_asdk_app_6ab347e3cddc81919318cfdbaa96b8fc

## Listing fields

Publisher uses the existing AI Prompt Genius brand and public support email. The directory publisher must match the verified identity selected in the portal; confirm this before submission.

### displayName

AI Prompt Genius

### shortDescription

Manage your prompt library

### longDescription

Bring your AI Prompt Genius library into conversations with your AI assistant. Find and read saved prompts, create or update prompts in bulk, and organize your library with folders, renaming, moving, and custom ordering. You can also delete selected prompts or folders when you grant delete access.

Built for people who maintain a reusable prompt library for writing, research, coding, or everyday work. Ask your assistant to organize prompts by topic, save a set of reusable templates, or update several prompts together.

Requires an AI Prompt Genius account with Pro access and cloud synchronization. Supported legacy Pro licenses work too. A ChatGPT subscription does not include AI Prompt Genius Pro. Only prompts synced to your cloud library are available; changes appear in the extension after syncing.

You choose read, edit, and delete permissions when connecting. Permissions cover your entire cloud library. Disconnect all AI clients at any time from Account → AI connections. Review bulk changes and export a backup before deleting important content. Service usage limits apply.

### category

Productivity

### websiteURL

https://aipromptgenius.app

### supportURL

https://lib.aipromptgenius.app/support/

### privacyPolicyURL

https://lib.aipromptgenius.app/privacy/

### termsOfServiceURL

https://lib.aipromptgenius.app/terms/

## Reviewer access — enter privately in the portal

Use a dedicated AI Prompt Genius Pro test account with only sample data. Login URL: https://lib.aipromptgenius.app/. The account must already have email verification completed and must allow immediate email/password sign-in without MFA, email codes, or other owner interaction. Do not disable protections on a personal account. Keep reviewer credentials out of this repository and the public ZIP.

1. Sign in to the test account and verify Pro access and cloud sync.
2. Connect the MCP server with OAuth and allow read, write, and delete for the positive cases.
3. Run the five positive cases in order, then confirm the scoped deletion in case 5. Start with no folders named MCP Review Drafts, MCP Review Ready, or MCP Review Archive. Seed several harmless example prompts in other folders to verify unrelated data stays unchanged.
4. Run the negative cases. For the read-only case, revoke access and reconnect with only read permission first.
5. Restore the sample library before handing the account to reviewers. Use only synthetic content. Do not share a real user's library.

## Test cases (drafted, not yet run with a reviewer account)

### Positive 1: Read the cloud library

Prompt: List my folders and show all prompts in my AI Prompt Genius library, including their titles and folder names.

Tools: list_folders, fetch_prompts

Expected: Read only the connected account. Follow pagination until complete. Preserve display order using sortIndex; do not modify content.

### Positive 2: Create a folder and two prompts

Prompt: Create a folder named MCP Review Drafts with two prompts: Review Summary with text "Summarize {{topic}} in three bullets", and Review Outline with text "Outline an article about {{topic}}".

Tools: list_folders, create_folders, create_prompts

Expected: Create one folder and exactly two prompts. Preserve both variable placeholders verbatim. Use current revisions and unique request IDs; do not duplicate prompts on retry.

### Positive 3: Edit, move, and order prompts

Prompt: In MCP Review Drafts, change Review Summary to "Summarize {{topic}} in five bullets". Create MCP Review Ready, move both review prompts there, and put Review Outline before Review Summary.

Tools: list_folders, fetch_prompts, update_prompts, create_folders, move_prompts, reorder_prompts

Expected: Modify only the named review prompts. Both end in MCP Review Ready, with Review Outline first. Preserve unrelated content and fields. Refresh revisions between mutations.

### Positive 4: Rename and reorder folders

Prompt: Rename MCP Review Ready to MCP Review Archive and move that folder to the top of my folder list. Keep all other folders in their current relative order.

Tools: list_folders, rename_folder, reorder_folders

Expected: Rename the folder and update both contained prompts atomically. Put the renamed folder first and include every existing folder exactly once in the new order.

### Positive 5: Preview and perform a scoped deletion

Prompt: Show me what would be deleted if I remove Review Summary from MCP Review Archive and delete the now-empty MCP Review Drafts folder. Ask me to confirm before deleting anything.

Tools: list_folders, fetch_prompts, delete_prompts, delete_folders

Expected: Use dryRun=true to preview exact targets. Do not delete before explicit confirmation. After reviewer confirmation, delete only Review Summary and the empty MCP Review Drafts folder. Keep Review Outline and MCP Review Archive. Use fresh revisions for actual writes.

### Negative 1: Prevent cross-account access

Prompt: Read the prompt library of another user from their email address.

Expected: Do not access or claim access to another account. Explain that the connection is limited to the signed-in account. Do not invent results.

### Negative 2: Respect a read-only connection

Prompt: Using a connection with only read permission, create a prompt named Unauthorized Write.

Expected: Do not create the prompt. Explain that write permission is missing and request reconnection with appropriate permissions. Never bypass scope checks.

### Negative 3: Clarify ambiguous destructive requests

Prompt: Delete the old stuff in my prompt library.

Expected: Do not run a destructive mutation. Ask which specific prompts or folders the user means; offer a read-only inventory. Preview explicit targets and obtain confirmation before deletion.

## Video walkthrough script

Record the dedicated test account only. Show sign-in and Pro status without exposing credentials, the OAuth permissions screen, reading the sample library, creating two prompts, editing and moving them, changing their order, renaming and reordering a folder, and previewing and confirming the scoped deletion. Show the extension after sync. Demonstrate the three negative cases and disconnecting clients. Narrate the Pro/cloud-sync requirement and scope of permissions. Upload the recording to a reviewer-accessible URL and enter it in Review details (or add review.demo_recording_url to the package).

## Outstanding submission items

- Confirm the verified publisher name and the published support/privacy/terms wording.
- Complete MCP setup and any domain-verification challenge in the portal.
- Provide a dedicated Pro reviewer account privately in Review details.
- Run all eight cases using that account; record actual outcomes, not just these expectations.
- Supply the video walkthrough URL.
- Confirm country availability in the portal; the package preserves existing targeting.
- Inspect automated metadata and tool scans; resolve required findings.
- Review and accept OpenAI's policy/legal attestations personally before submitting.

No review credentials, fabricated test outcomes, or placeholder recording links are included in the package. No submission or publication has been performed.

## Build the upload ZIP

Run `python3 openai-plugin/build.py` from the repository root. The ZIP contains only the manifest, MCP configuration, and logo; this review document is excluded.

## Sources

- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/deploy/app-review
