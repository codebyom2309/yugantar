async function main() {
  const res = await fetch('http://localhost:3000/api/competitions');
  const data = await res.json();
  console.log(`Fetched ${data.competitions?.length} competitions from API:`);
  for (const c of data.competitions || []) {
    console.log(`\n--- ${c.name} (${c.slug}) ---`);
    console.log(`Coordinators count: ${c.coordinators?.length || 0}`);
    if (c.coordinators) {
      for (const coord of c.coordinators) {
        console.log(`  - [${coord.role}] ${coord.name} (Phone: ${coord.phone || 'none'}, Email: ${coord.email || 'none'})`);
      }
    }
  }
}

main().catch(console.error);
