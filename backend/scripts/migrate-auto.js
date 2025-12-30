// Cross-platform script to conditionally run migrations
// This runs after 'npm run build', so dist/ folder exists

if (process.env.SKIP_MIGRATIONS === 'true') {
  console.log('⏭️  Skipping migrations (SKIP_MIGRATIONS=true)');
  process.exit(0);
}

// Run the migration script
require('../dist/src/scripts/run-migrations.js');

