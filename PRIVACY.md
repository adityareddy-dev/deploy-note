# Deploy Note privacy policy

Effective November 6, 2026.

Deploy Note is a demo app for Jira Cloud, provided by Aditya Reddy. It displays and stores the fixed example in `fixtures/failed-check.json` on the Jira issue where you run it.

The app reads the current issue's identifier and its saved demo note. When you select Replay demo fixture, it replaces the `deploy-note.demo.v1` issue property with the repository fixture. It does not store your name, email address, comments, issue description, or other personal data. The example service, change, log line, request identifier, and timestamp are demo data.

Requests run through Atlassian Forge and Jira as the signed-in user. The app has no external server, analytics service, model API, or external data transfer. Atlassian processes platform and account information under its own privacy policy.

The note remains on the issue until its property or the issue is deleted. Uninstalling the app does not necessarily remove a Jira issue property. A Jira administrator or a user with permission to edit the issue can remove the property through Jira's issue property API. Issue properties are not a secret store, and other apps or users with suitable Jira permissions may access them.

Questions or deletion assistance: adityareddy.dev@gmail.com.
