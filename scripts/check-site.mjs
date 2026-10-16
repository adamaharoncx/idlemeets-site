import { checkPublish, checkSite } from './site-safety.mjs';

const args = process.argv.slice(2);
if (args.length % 2 || args.some((arg, index) => index % 2 === 0 && !['--ref', '--base'].includes(arg))) {
  console.error('Usage: node scripts/check-site.mjs [--ref HEAD] [--base published-commit]');
  process.exit(1);
}
try {
  const options = Object.fromEntries(Array.from({ length: args.length / 2 }, (_, index) => [args[index * 2], args[index * 2 + 1]]));
  const ref = options['--ref'] ?? 'HEAD';
  const count = options['--base'] ? checkPublish(process.cwd(), ref, options['--base']) : checkSite(process.cwd(), ref);
  console.log(`Footer safety passed: ${count} committed pages have the complete footer and valid destinations.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
