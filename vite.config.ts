import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repository = process.env.GITHUB_REPOSITORY;
const [owner, repositoryName] = repository?.split('/') ?? [];
const isUserOrOrgSite = repositoryName?.toLowerCase() === `${owner?.toLowerCase()}.github.io`;
const base = process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserOrOrgSite
  ? `/${repositoryName}/`
  : '/';

export default defineConfig({ base, plugins: [react()] });
