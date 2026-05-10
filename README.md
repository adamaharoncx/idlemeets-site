# Idle Website

Static website for `idlemeets.com`.

This site is intentionally simple:

- HTML files hold the page content.
- `styles.css` controls the design.
- There is no React, backend, database, or build tool.
- GitHub Pages can publish this from the `main` branch and the repository root.

## Pages

- `/`
- `/privacy/`
- `/support/`
- `/download/`

## Beginner explanation

Think of the setup like this:

1. The domain is the name people type: `idlemeets.com`.
2. GitHub is where the website files live.
3. GitHub Pages is the free hosting service that shows those files as a website.
4. DNS is the address book that tells the domain where GitHub Pages lives.

Do not change nameservers unless you intentionally want Spaceship to stop managing DNS.

## GitHub Pages setup

After this folder is pushed to a GitHub repo named `idlemeets-site`:

1. Open the repo on GitHub.
2. Click `Settings`.
3. Click `Pages` in the left sidebar.
4. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main`.
6. Set the folder to `/root`.
7. Click `Save`.
8. In `Custom domain`, enter `idlemeets.com`.
9. Click `Save`.
10. Wait for GitHub to check the domain.
11. Turn on `Enforce HTTPS` once GitHub allows it.

## Spaceship DNS records

Stop before making these changes unless you are ready to point `idlemeets.com` at GitHub Pages.

Add these records in Spaceship DNS:

```text
Type: A
Host: @
Value: 185.199.108.153
TTL: Automatic or default

Type: A
Host: @
Value: 185.199.109.153
TTL: Automatic or default

Type: A
Host: @
Value: 185.199.110.153
TTL: Automatic or default

Type: A
Host: @
Value: 185.199.111.153
TTL: Automatic or default

Type: CNAME
Host: www
Value: YOUR-GITHUB-USERNAME.github.io
TTL: Automatic or default
```

Replace `YOUR-GITHUB-USERNAME` with the real GitHub username or organization that owns the `idlemeets-site` repo.

## Placeholders to replace

- App Store URL in `index.html` and `download/index.html`.
- Instagram URL in page footers and support page.
- Contact email addresses after domain email is configured.

## Local testing

Open `index.html` in a browser. The site should load without a server.
