import { collection, config, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'gesproject/kevsunastro',
    branchPrefix: 'keystatic-proof/',
  },
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
