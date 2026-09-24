const { seedCategories } = require('./src/seeds/categories.seed');
const { seedProducts } = require('./src/seeds/products.seed');

async function seedAll() {
  console.log('=== Seeding Categories ===');
  await seedCategories();
  console.log('\n=== Seeding Products ===');
  await seedProducts();
  console.log('\n✓ All seeding completed successfully!');
}

seedAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
