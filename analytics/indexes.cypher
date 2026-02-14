// Neo4j indexes for all query patterns
// Run after data load: cat indexes.cypher | cypher-shell -a bolt://localhost:7687

// Node property indexes for search
CREATE INDEX IF NOT EXISTS FOR (n:Person) ON (n.id);
CREATE INDEX IF NOT EXISTS FOR (n:Person) ON (n.label);
CREATE INDEX IF NOT EXISTS FOR (n:Person) ON (n.name);
CREATE INDEX IF NOT EXISTS FOR (n:Organization) ON (n.id);
CREATE INDEX IF NOT EXISTS FOR (n:Organization) ON (n.label);
CREATE INDEX IF NOT EXISTS FOR (n:Location) ON (n.id);
CREATE INDEX IF NOT EXISTS FOR (n:Location) ON (n.label);

// Community indexes
CREATE INDEX IF NOT EXISTS FOR (n:Community) ON (n.id);
CREATE INDEX IF NOT EXISTS FOR (n:Community) ON (n.level);
CREATE INDEX IF NOT EXISTS FOR (n:Community) ON (n.community_id);

// View indexes
CREATE INDEX IF NOT EXISTS FOR (n:View) ON (n.slug);

// General node index
CREATE INDEX IF NOT EXISTS FOR (n:Person) ON (n.node_type);
CREATE INDEX IF NOT EXISTS FOR (n:Organization) ON (n.node_type);
CREATE INDEX IF NOT EXISTS FOR (n:Location) ON (n.node_type);
