# Deploy Note

Deploy Note puts the service, deployed change, and failed log line next to the Jira issue a software team is investigating. It is a Forge issue panel with one fixed example, stored as an issue property. Replaying the example replaces that property, so retries do not add duplicate notes or comments.

The example is **demo data**. It does not measure a production outage, connect to a deployment system, or establish that the change caused the failed check.

## Current build

The app is registered, deployed to development and production, and installed on the free developer site `adityareddy-deploynote-2026.atlassian.net`. The demo issue is [KAN-1](https://adityareddy-deploynote-2026.atlassian.net/browse/KAN-1). This site uses its owner's account. Judges use their own Jira Cloud site through the shared installation route below.

The installed development panel has been checked for preview, write, reload, browser reopen, replay, and a denied write after temporarily removing its write scope. Sharing is enabled and the production app was installed through the shared link on November 6, 2026. Production replay and saved-note reload worked on KAN-1. A silent install-and-issue recording is available for review.

The current demo site is scheduled to deactivate on December 6, 2026. Its KAN-1 link is for the current demo, and is not the judge installation route. A fresh free demo site is planned near submission. The shared installation link installs on your own site and does not require the current demo site to stay active.

## Run the core path locally

Use Node.js 24.22.1 or later in the 24.x LTS line. From this directory:

```sh
npm ci
npm test
npm run typecheck
```

The tests cover failed reloads and successful recovery in the panel, writing the fixture, concurrent replay, loading the saved note, invalid issue context, permissions, unavailable Jira, and changed saved data. They use an in-memory Jira substitute. They do not establish that a live Forge install works.

## Install a development copy

You need an Atlassian account, a free Jira Cloud developer site, and site administrator access to install the app. The person using the panel needs permission to browse and edit the target issue. No shared account or password is included.

```sh
npm ci
npx forge login
npx forge register "Deploy Note"
npx forge lint
npx forge deploy --environment development
npx forge install --environment development --site YOUR-SITE.atlassian.net --product jira
```

`forge login` uses your own Atlassian email and Forge-scoped API token. Keep the token outside this repository. For a separate development copy, `forge register` replaces the included app ID with your own app registration and asks you to select a Developer Space. Do this once, before deployment. Personal registration is unavailable in some Developer Spaces, so the command above uses standard registration. Follow the [Forge setup guide](https://developer.atlassian.com/platform/forge/getting-started/) to create a free developer site. The development deployment uses the Aditya Reddy Developer Space. No payment method was added.

## Replay the fixture on Jira

1. In the developer site's Jira project, create or open one issue you can edit.
2. Open the issue's **Apps** menu below the summary, then select **Deploy Note**. The panel shows **Demo data** and the preview from `fixtures/failed-check.json`.
3. Click **Replay demo fixture**. Confirm that the panel says it was saved on the issue you opened.
4. Confirm the service is `checkout-api`, the change reduces the payment gateway timeout to 500 ms, and the log line reports a timeout after 500 ms.
5. Click **Reload saved note**, then reload the browser and reopen the panel. The same note should still be present.
6. Click **Replay demo fixture** again. The app replaces the same property. There should still be one note, with no new comments or description changes.

The fixture's timestamp is part of the example, not the time the replay ran. The app writes only to the issue in the resolver's Jira context. It ignores caller-supplied issue IDs and fixture content.

## Judge installation

[Install Deploy Note in Jira](https://developer.atlassian.com/console/install/528aa571-9664-4bd8-b90b-f024bd2c9593?signature=AYABeJL4bE%2B4WmnANF%2FLrLlTJTMAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBm3fTqs6KP9gM0vr0X718kwAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDDtCqXkrN347ZXfIZgIBEIA7NkjBlj9ARhilNOX1GX1SJucbTBKddByhDGE%2BVL1d3ofUeeC1ekMLs%2FAFpEkK6D9CLZ%2Bo7%2FWoreDbF54AB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgHuHlncujlJ17U6df%2BWHZqFAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMm31PkAa4WfGTqeVDAgEQgDsbqkLvJZEdzV4RixSc9JPJwWMsSzpb1GLU8FB%2FpYkf3a91OObnZZjXA5prcmHZSfsjJvTGqG408e6L%2BAAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAZSff2M7exwHn%2FUMrBuJ9w0AAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAyTn4%2BXYt0csrP77isCARCAO0ZtHoP4nERKZ2EvBWrRMlCdgzFdBA36m7m6dLv0rlKuF5oQFkwvXYLLE3NtDaGYdFc6M1vdVSnSPS85AgAAAAAMAAAQAAAAAAAAAAAAAAAAAMTDItbzHtXF90l3Hce0%2BPv%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADJ9alLSG9JWmoUm6NYqp7PJZLS8Myk5AP4ms%2F9M9nek%2BqYdAUrIq6D2%2FCHpM7aPbUAbE2Bv8yYIpbFlHClrrkAG%2BYc%3D&product=jira)

Sign in with your own Atlassian account. Select a Jira Cloud site you administer, review the two Jira permissions, and install. Then create or open one editable issue and follow **Replay the fixture on Jira** above. No CLI or access to the demo owner's account is needed. The shared link was tested on November 6, 2026 by installing production version 2 on the demo site as its administrator. The installed panel loaded the note and saved and reloaded the fixture. This check used the owner account, not an unrelated account or a second site.

The shared installation uses the production Forge deployment. The fixture is bundled with the app and runs against the issue in your own site. It has no dependency on the demo site's hostname or issue key. See [Forge distribution](https://developer.atlassian.com/platform/forge/distribute-your-apps/#start-sharing-your-app).

## Data and permissions

The app requests `read:jira-work` and `write:jira-work`. Requests run as the current user. It reads and replaces the `deploy-note.demo.v1` property on the current issue. Jira issue properties are not a secret store and other apps with suitable Jira permissions can read them. This app stores only the fixed demo fixture.

There is no external backend, outbound data transfer, scheduled task, or model API. Teamwork Graph, Confluence, Marketplace, and bonus categories are not part of this build. A Jira property is used so the note stays attached to the issue and repeated replays have a single destination.

## Troubleshooting

If the shared installer says the app is already installed, use the existing production installation, or remove the development installation from that site before installing the shared production app.

If the panel reports a permission error, sign in with an account that can browse and edit the issue. If it reports throttling, wait and retry. If the saved property was changed, replay restores the repository fixture. A failed request clears the old note and leaves the error visible. A successful retry restores the note.

The production dependency audit is clear. Forge CLI 15.0.0 has development-tool advisories in its locked dependency tree, including three critical packages used by its tunnel tooling. Normal audit fixes and compatible overrides do not replace those shrinkwrapped versions. This app uses lint and deploy, not a development tunnel. No forced major dependency changes are applied.

## Privacy

See [PRIVACY.md](PRIVACY.md) for the demo data stored on an issue, deletion, and contact details.

## License

MIT, see [LICENSE](LICENSE).
