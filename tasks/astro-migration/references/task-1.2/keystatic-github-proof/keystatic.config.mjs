import { collection, config, fields } from '@keystatic/core';

const githubRepository = import.meta.env.PUBLIC_KEYSTATIC_GITHUB_REPOSITORY;

export default config({
  // The proof stays locally runnable until the client supplies its repository identifier.
  // Supplying owner/repository switches the same schema to the required GitHub mode.
  storage: githubRepository
    ? {
        kind: 'github',
        repo: githubRepository,
        branchPrefix: 'keystatic-proof/',
      }
    : { kind: 'local' },
  collections: {
    editorialProofs: collection({
      label: 'Editorial proofs',
      slugField: 'title',
      path: 'content/editorial-proofs/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        note: fields.text({ label: 'Editorial note', multiline: true }),
      },
    }),
  },
});
