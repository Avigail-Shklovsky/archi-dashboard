# ניהול פרויקטים

An internal, Hebrew (RTL) project-management app built for one surveying and architecture office.
Admins open projects and assign them; each project gets a to-do list generated from its type and level of
detailing; the assigned worker ticks tasks off and submits the project when everything is done.

This is a private project for a specific client. It is not packaged for reuse, and setup is intentionally not documented here.

## Features

**Sign-in and roles**
- Sign-in with Google, by invitation only. Anyone an admin hasn't added is refused.
- Two roles: admin and worker. An admin who also works on projects can switch between "ניהול" and "העבודה שלי",
  which shows only their own assignments, as a worker sees them. The switch changes the view, not the permissions.

**Team (admins)**
- Add a worker by name and Google email, rename them, or remove them after a warning.
- A removed worker loses access on their next request; their projects stay, unassigned.

**Projects**
- Fields: nickname / address, type (פנים / חוץ), project name (פנים only: תכנון אדריכלי, שטחים, or both),
  purpose, software, level of detailing, assignee, priority.
- Levels of detailing, each with its own name:
  - תכנון אדריכלי — pick any of 7 drawings (תוכנית תנוחה, חתכים, חזיתות, ...).
  - שטחים — one of 4 levels; each includes the ones before it.
  - חוץ — one of 3 levels.
- Admins edit everything, delete after confirming, and can reopen a submitted project.

**Task list**
- Generated from the office's templates: general tasks, one group per level (opening with the level's own name),
  and submission tasks that depend on the software (e.g. which files to attach).
- Groups fold open and closed, with a `done/total` count that turns into a check mark when complete.
- Admins add, rename, delete and drag their own tasks between levels.
- Changing type, levels or software updates the list; completed and hand-added tasks are kept.

**Day-to-day work**
- Project list with search, filters (type, status, priority, assignee) and a reset button.
- Ticking a task shows at once; saves run in order in the background.
- "Submit" is available only when every task is done; after that the project is locked.
- Private notes ("ההערות שלי") on each project, for the person it is assigned to. Saved while typing.

**Notifications**
- In-app bell: assigned to a project, tasks added, a project raised to high priority, a project submitted.
- Designed HTML emails: to admins when a project is submitted, and to the worker when their project becomes high priority.

## Permissions

Every rule below is checked on the server on every request; the interface only hides what isn't allowed.

| Action | Admin | Worker |
| --- | --- | --- |
| See projects | All | Only their own |
| Create, edit, delete, assign, set priority | Yes | No |
| Add, rename, move, delete tasks | Yes | No |
| Tick a task | Yes | Own project, until submitted |
| Submit | When assigned | Only when every task is done |
| Reopen a submitted project | Yes | No |
| Manage the team | Yes | No |
| Private notes | Own, on projects assigned to them | Own, on their projects |

Other safeguards: the role is derived from server configuration on each request, never from the browser;
a project that isn't yours answers "not found"; submit is a single atomic check; user-typed text is escaped in emails.

## Example data

Screens and tests use made-up data only, for example:

| Project | Type | Assigned to |
| --- | --- | --- |
| רחוב הדוגמה 1, עיר לדוגמה | פנים · תכנון אדריכלי | עובדת א' |
| מבנה לדוגמה, אזור תעשייה | חוץ | לא משויך |

## Stack

React (Vite) client · Node.js / Express API · MongoDB (Mongoose) · Google Identity Services · Nodemailer.

```
client/   React app (pages, components, styles)
server/   Express API, models, task templates, email templates
```

The task templates live in `server/src/taskTemplates.js`.
