# Pulluru Bhavith · Portfolio

Personal portfolio site: plain HTML, CSS and JavaScript, no build step.
Live at **https://bhavithbhavi.github.io** once deployed.

```
index.html                      page content
assets/css/styles.css           styles (light + dark theme)
assets/js/main.js               theme toggle, menu, filters, hero agent-graph animation
assets/Pulluru_Bhavith_Resume.pdf
assets/favicon.svg
```

## Run locally

```bash
python -m http.server 5500
```

Then open http://localhost:5500.

## Deploy to GitHub Pages (free) from the Bhavithbhavi account

This machine's `gh` CLI is signed in to the work account, so add and switch to the personal one first:

```bash
gh auth login            # GitHub.com → HTTPS → log in with a web browser, as Bhavithbhavi
gh auth switch --user Bhavithbhavi
gh auth setup-git        # make git push use the active gh account
```

Create the repo and push (the repo name must be exactly `Bhavithbhavi.github.io`):

```bash
git init -b main
git config user.name "Pulluru Bhavith"
git config user.email "125278387+Bhavithbhavi@users.noreply.github.com"
git add .
git commit -m "Initial portfolio"
gh repo create Bhavithbhavi.github.io --public --source . --push
```

GitHub publishes `<username>.github.io` repos automatically from `main`. If it isn't live after a few
minutes, open the repo's **Settings → Pages** and set **Source: Deploy from a branch → main / (root)**.

Switch back to the work account afterwards:

```bash
gh auth switch --user VTS040Bhavith
```

## Editing

- Projects, experience and skills are plain HTML in `index.html`.
- Project filter chips use each card's `data-tags` (`llm`, `media`, `vision`, `infra`).
- Add a LinkedIn link in the Contact section (there is a commented placeholder).
- Replace `assets/Pulluru_Bhavith_Resume.pdf` to update the downloadable resume.
