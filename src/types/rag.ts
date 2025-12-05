export type RagType = {
  similarity: number;
  content: string;
};

export type TavilyResultType = {
  title: string;
  url: string;
  content: string;
  rawContent: string;
  score: number;
};

export type TavilyType = {
  results: TavilyResultType[];
};

export interface RagResult {
  rag: RagType;
  tavily: TavilyType;
  tavilyQuery: string;
  fusion: string;
}
