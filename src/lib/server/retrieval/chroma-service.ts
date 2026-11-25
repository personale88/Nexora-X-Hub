/**
 * RepoPilot AI — ChromaDB Vector Retrieval Service
 * Indexes repository source code chunks with strict repository isolation,
 * branch/commit metadata, and semantic search.
 * Provides resilient local keyword fallback when ChromaDB is not running.
 */

import { ChromaClient } from 'chromadb';

export interface CodeChunk {
  id: string;
  repoId: string;
  branch: string;
  commitSha: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
}

export interface RetrievalResult {
  chunk: CodeChunk;
  score: number;
  source: 'chromadb' | 'ast-keyword-fallback';
}

export class ChromaRetrievalService {
  private client: ChromaClient | null = null;
  private isConnected: boolean | null = null;
  private chromaUrl: string;

  constructor(chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000') {
    this.chromaUrl = chromaUrl;
  }

  private async getClient(): Promise<ChromaClient | null> {
    if (this.isConnected === false) return null;
    if (this.client) return this.client;

    try {
      const client = new ChromaClient({ path: this.chromaUrl });
      await client.heartbeat();
      this.client = client;
      this.isConnected = true;
      return client;
    } catch {
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Index code chunks into isolated repository collection
   */
  public async indexChunks(repoId: string, chunks: CodeChunk[]): Promise<boolean> {
    const client = await this.getClient();
    if (!client || chunks.length === 0) return false;

    try {
      const sanitizedCollName = `repo_${repoId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const collection = await client.getOrCreateCollection({ name: sanitizedCollName });

      const ids = chunks.map((c) => c.id);
      const documents = chunks.map((c) => c.content);
      const metadatas = chunks.map((c) => ({
        repoId: c.repoId,
        branch: c.branch,
        commitSha: c.commitSha,
        filePath: c.filePath,
        startLine: c.startLine,
        endLine: c.endLine,
      }));

      await collection.upsert({
        ids,
        documents,
        metadatas,
      });

      return true;
    } catch (err) {
      console.warn('ChromaDB indexing fallback:', err);
      return false;
    }
  }

  /**
   * Search for relevant code chunks matching an issue description
   */
  public async search(
    repoId: string,
    query: string,
    fallbackChunks: CodeChunk[],
    limit = 5
  ): Promise<RetrievalResult[]> {
    const client = await this.getClient();

    if (client) {
      try {
        const sanitizedCollName = `repo_${repoId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const collection = await client.getCollection({ name: sanitizedCollName });
        const results = await collection.query({
          queryTexts: [query],
          nResults: limit,
        });

        if (results.documents?.[0] && results.documents[0].length > 0) {
          const docs = results.documents[0];
          const metas = results.metadatas?.[0] || [];
          const distances = results.distances?.[0] || [];

          return docs.map((doc, idx) => {
            const meta = (metas[idx] || {}) as any;
            return {
              chunk: {
                id: (results.ids[0]?.[idx] as string) || `c_${idx}`,
                repoId,
                branch: meta.branch || 'main',
                commitSha: meta.commitSha || 'HEAD',
                filePath: meta.filePath || 'source.ts',
                startLine: meta.startLine || 1,
                endLine: meta.endLine || 20,
                content: doc || '',
              },
              score: 1 - (distances[idx] || 0.1),
              source: 'chromadb',
            };
          });
        }
      } catch (err) {
        console.warn('ChromaDB query fallback to keyword search:', err);
      }
    }

    // Keyword & Token Similarity Fallback
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const scored = fallbackChunks.map((chunk) => {
      let matches = 0;
      const lower = chunk.content.toLowerCase();
      for (const term of terms) {
        if (lower.includes(term)) matches++;
      }
      return {
        chunk,
        score: matches / Math.max(1, terms.length),
        source: 'ast-keyword-fallback' as const,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
