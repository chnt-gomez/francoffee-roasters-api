const mongoose = require('mongoose');
// Adjust this path to wherever your Item/CoffeeItem schemas are exported
// Using the '#schema' alias you used in your service files!
const { CoffeeItem } = require('#schema/itemSchema');

// Connect to the exposed Docker port on your local machine
// Using 'coffee_shop' based on your previous logs
const MONGO_URI = 'mongodb://admin:password123@localhost:27017/coffee_shop?authSource=admin';

const seedData = [
    {
        name: "Puebla Reserve Espresso",
        description: "A bold, locally inspired blend with heavy notes of dark chocolate and roasted nuts.",
        img_src: "https://example.com/images/puebla-reserve.jpg",
        price: 320,
        stock: 50,
        presentation: "250g"
    },
    {
        name: "Veracruz Washed",
        description: "Bright acidity with hints of orange blossom and cane sugar. Perfect for pour-over.",
        img_src: "https://example.com/images/veracruz-washed.jpg",
        price: 300,
        stock: 30,
        presentation: "250g"
    },
    {
        name: "Oaxaca Natural",
        description: "Intensely fruity and sweet, featuring notes of strawberry and milk chocolate.",
        img_src: "https://example.com/images/oaxaca-natural.jpg",
        price: 580,
        stock: 20,
        presentation: "500g"
    },
    {
        name: "Chiapas Honey Process",
        description: "Smooth and balanced with a pronounced caramel sweetness and a buttery body.",
        img_src: "https://example.com/images/chiapas-honey.jpg",
        price: 1100,
        stock: 15,
        presentation: "1kg"
    },
    {
        name: "Nayarit Mountain Water Decaf",
        description: "All the flavor, none of the jitters. Mild, sweet, and perfectly balanced.",
        img_src: "https://example.com/images/nayarit-decaf.jpg",
        price: 350,
        stock: 40,
        presentation: "250g"
    }
];

const seedDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB at', MONGO_URI, '...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🧹 Clearing existing test items...');
        await CoffeeItem.deleteMany({});

        console.log('🌱 Planting coffee beans...');
        await CoffeeItem.insertMany(seedData);

        console.log('☕ Successfully seeded 5 Coffee Items!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding the database:', err);
        process.exit(1);
    }
};

seedDB();