import { CERTIFICATIONS } from './tokens.js'; // Adjust path if needed

let sql = 'INSERT INTO certifications (id, name, avg_cost, avg_hike, time_months, demand, link, affiliate, tags, domain_id, for_who) VALUES\n';

const values = CERTIFICATIONS.map(cert => {
  // Escape single quotes for SQL
  const safeName = cert.name.replace(/'/g, "''");
  const safeDemand = cert.demand.replace(/'/g, "''");
  const safeLink = cert.link.replace(/'/g, "''");
  const safeDomain = cert.domain.replace(/'/g, "''");
  const safeForWho = cert.forWho.replace(/'/g, "''");
  
  // Format the tags array for PostgreSQL
  const safeTags = `ARRAY[${cert.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}]`;

  return `('${cert.id}', '${safeName}', ${cert.avgCost}, ${cert.avgHike}, ${cert.timeMonths}, '${safeDemand}', '${safeLink}', ${cert.affiliate}, ${safeTags}, '${safeDomain}', '${safeForWho}')`;
});

sql += values.join(',\n') + ';';

console.log(sql);