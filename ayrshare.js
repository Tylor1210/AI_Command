const axios = require('axios');

const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY;

async function postToAyrshare(platform, post, imageUrl, postType) {
    console.log(`postToAyrshare called with: platform=${platform}, postType=${postType}, imageUrl=${imageUrl ? 'Present' : 'Missing'}`);
    try {
        const body = {
            platforms: [platform],
            post: post
        };

        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            body.mediaUrls = [imageUrl];
        }

        // Handle Instagram Stories
        if (platform.toLowerCase() === 'instagram' && postType === 'Story') {
            body.instagramOptions = { stories: true }; // MUST be 'stories' (plural) per Ayrshare API docs
        }

        console.log("Ayrshare Request Body:", JSON.stringify(body, null, 2));

        const response = await axios.post(
            'https://app.ayrshare.com/api/post',
            body,
            {
                headers: {
                    Authorization: `Bearer ${AYRSHARE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Ayrshare Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

module.exports = { postToAyrshare };
