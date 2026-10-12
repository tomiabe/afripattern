# AfriPattern

An interactive pattern studio that turns African flag colors into generative designs.

## Run locally

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
```

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site when changes reach `main` or `master`. In the repository settings, choose **Pages** and set the source to **GitHub Actions**. The Vite build automatically uses the project path for GitHub Pages.
