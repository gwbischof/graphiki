// Singleton neo4j-driver wrapper for Neo4j
// Server-only — never import from client components

import neo4j, { Driver, Session, Record as Neo4jRecord } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver | null {
  const uri = process.env.NEO4J_URI;
  if (!uri) return null;

  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic("", ""), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
      maxTransactionRetryTime: 15000,
    });
  }
  return driver;
}

export function isNeo4jAvailable(): boolean {
  return !!process.env.NEO4J_URI;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runQuery<T = Neo4jRecord>(
  cypher: string,
  params: Record<string, unknown> = {},
  timeout = 30000
): Promise<T[]> {
  const d = getDriver();
  if (!d) throw new Error("Neo4j not configured (NEO4J_URI not set)");

  // Neo4j requires integer params (LIMIT, SKIP, level) as neo4j Integer type
  const safeParams: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    safeParams[k] = typeof v === "number" && Number.isInteger(v) ? neo4j.int(v) : v;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const session: Session = d.session({ defaultAccessMode: neo4j.session.READ });
    try {
      const result = await session.run(cypher, safeParams, {
        timeout: neo4j.int(timeout),
      });
      return result.records as unknown as T[];
    } catch (error) {
      lastError = error as Error;
      // Only retry on connection errors, not query errors
      const msg = String(error);
      if (msg.includes("connection") || msg.includes("timeout") || msg.includes("ECONNREFUSED")) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
      throw error;
    } finally {
      await session.close();
    }
  }

  throw lastError || new Error("Query failed after retries");
}

export async function writeQuery<T = Neo4jRecord>(
  cypher: string,
  params: Record<string, unknown> = {},
  timeout = 30000
): Promise<T[]> {
  const d = getDriver();
  if (!d) throw new Error("Neo4j not configured (NEO4J_URI not set)");

  const safeParams: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    safeParams[k] = typeof v === "number" && Number.isInteger(v) ? neo4j.int(v) : v;
  }

  const session: Session = d.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, safeParams, {
      timeout: neo4j.int(timeout),
    });
    return result.records as unknown as T[];
  } finally {
    await session.close();
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
