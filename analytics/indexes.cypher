// Memgraph indexes for all query patterns
// Run after data load: cat indexes.cypher | mgconsole

// Node property indexes for search
CREATE INDEX ON :Person(id);
CREATE INDEX ON :Person(label);
CREATE INDEX ON :Person(name);
CREATE INDEX ON :Organization(id);
CREATE INDEX ON :Organization(label);
CREATE INDEX ON :Location(id);
CREATE INDEX ON :Location(label);

// Community indexes
CREATE INDEX ON :Community(id);
CREATE INDEX ON :Community(level);
CREATE INDEX ON :Community(community_id);

// View indexes
CREATE INDEX ON :View(slug);

// General node index
CREATE INDEX ON :Person(node_type);
CREATE INDEX ON :Organization(node_type);
CREATE INDEX ON :Location(node_type);

// Edge property indexes (Memgraph supports these with --storage-properties-on-edges=true)
// Note: Memgraph indexes on edge properties are not supported via CREATE INDEX
// but the flag enables property access on edges
