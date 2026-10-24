export type KnowledgeSource = {
  citationId?: string;
  sourceId?: string;
  versionId?: string;
  chunkId?: number;
  title: string;
  expertName?: string;
  locator?: string;
  reviewedAt?: string;
  url?: string;
  kind: 'internal' | 'web';
};
