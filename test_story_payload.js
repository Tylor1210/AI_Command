require('dotenv').config();
const { postToAyrshare } = require('./ayrshare');

async function testStoryPayload() {
    console.log("Testing Instagram Story Payload...");

    const platform = "Instagram";
    const post = "Test Story Caption";
    const imageUrl = "https://example.com/image.png";
    const postType = "Story";

    try {
        // We expect this to fail authentication or API call (since it's a dummy URL/key), 
        // but we ONLY care about the console.log of the body that happens BEFORE the request.
        await postToAyrshare(platform, post, imageUrl, postType);
    } catch (error) {
        console.log("Expected error (API call failed), but check the logs above for the Request Body.");
    }
}

testStoryPayload();
