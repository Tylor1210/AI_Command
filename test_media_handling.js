require('dotenv').config();
const { postToAyrshare } = require('./ayrshare');

async function test() {
    console.log("Testing with valid image...");
    await postToAyrshare('Instagram', 'Valid post content', 'https://via.placeholder.com/150');

    console.log("\nTesting with empty image...");
    await postToAyrshare('Instagram', 'Valid post content', '');

    console.log("\nTesting with undefined image...");
    await postToAyrshare('Instagram', 'Valid post content', undefined);

    console.log("\nTesting with null image...");
    await postToAyrshare('Instagram', 'Valid post content', null);
}

test();
