require('dotenv').config();
const { OpenAI } = require('openai');
const Airtable = require('airtable'); 
const SocialMediaAPI = require('social-media-api'); 

// --- Initialize Clients ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
    process.env.AIRTABLE_BASE_ID
);
const social = new SocialMediaAPI(process.env.SOCIAL_SCHEDULER_API_KEY); 
// --------------------------

// Configuration
const AIRTABLE_CONTENT_TABLE = "Social Media Posts";
const TARGET_TOPIC = "The latest advancements, tools, and business applications of AI Automation and Software Engineering.";
const TARGET_INDUSTRY = "A leading AI Automation and Software Engineering Agency.";


// === FUNCTION A: GENERATE NEW CONTENT & PUSH TO AIRTABLE (FINAL VERSION) ===
async function generateAndStorePosts() {
    console.log(`\n[1/2] Generating and storing content for: "${TARGET_TOPIC}"...`);

    // The system prompt now requests specific structure and content types.
    const systemPrompt = `You are a social media marketing expert for ${TARGET_INDUSTRY}. Generate exactly one unique social media post for the topic: "${TARGET_TOPIC}". 
    
    Structure the output as a single JSON object with a top-level key named "posts" that contains a list (array) of the one post. Each post object MUST have the following required properties: 
    1. platform (LinkedIn, Instagram, X)
    2. postType (Must be 'Feed Post' or 'Story')
    3. caption (Short, punchy text. For 'Story' posts, this is the overlay text.)
    4. imageConcept (Description of the visual, ensure vertical orientation is noted for 'Story' posts.)
    
    Ensure the post is an 'Instagram' post with the 'Story' postType for your current testing.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.4, // Lower temperature for strict JSON adherence
        });

        const jsonOutput = JSON.parse(response.choices[0].message.content);
        const postsArray = jsonOutput.posts || [];

        if (postsArray.length === 0) {
            console.log("❌ AI did not return a valid list of posts.");
            return;
        }

        // --- LOGIC: Loop through posts to generate and save image for each one ---
        const recordsToCreate = [];

        for (const post of postsArray) {
            // CALL NEW FUNCTION to generate a DALL-E image
            const imageUrl = await generateImage(post.imageConcept, post.postType);

            if (imageUrl) {
                recordsToCreate.push({
                    fields: {
                        "Caption": post.caption,
                        "Platform": post.platform,
                        "Image Concept": post.imageConcept,
                        "Post Type": post.postType,
                        "Image URL": imageUrl, // <--- DALL-E URL SAVED HERE
                        "AI Status": "Generated - Needs Review" 
                    }
                });
            }
        }
        
        // This is the Airtable push step that used to be separate
        await airtable(AIRTABLE_CONTENT_TABLE).create(recordsToCreate);
        console.log(`✅ ${recordsToCreate.length} new posts (with DALL-E images) pushed to Airtable for review!`);
        return recordsToCreate.length;
        // -----------------------------------------------------------------------------

    } catch (error) {
        console.error("❌ Error during content generation or Airtable push:", error.message);
        return 0;
    }
}

// === FUNCTION B: SCHEDULE POSTS READY TO SEND (FINAL VERSION) ===
async function scheduleAndSendPosts() {
    console.log("\n[2/2] Checking Airtable for posts ready to schedule...");

    // Filter posts where Status is 'Ready to Post'
    const records = await airtable(AIRTABLE_CONTENT_TABLE)
        .select({
            filterByFormula: "{AI Status} = 'Ready to Post'", 
            maxRecords: 5 
        })
        .firstPage();

    if (records.length === 0) {
        console.log("No posts found with 'Ready to Post' status.");
        return;
    }

    console.log(`Found ${records.length} posts to publish...`);

    for (const record of records) {
        const platform = record.get('Platform');
        const caption = record.get('Caption');
        const postType = record.get('Post Type');
        const recordId = record.id;
        
        // --- NEW: Retrieve the DALL-E URL from the record ---
        const imageURL = record.get('Image URL'); 
        
        try {
            if (!imageURL || record.get('AI Status') !== 'Ready to Post') continue; 

            // 1. Prepare the base post payload
            let postPayload = {
                post: caption,
                platforms: [platform.toLowerCase()],
                mediaUrls: [imageURL], // <--- USING THE DALL-E URL HERE
            };

            // 2. Adjust payload specifically for Instagram Story
            if (platform === 'Instagram' && postType === 'Story') {
                console.log(`Adapting post for Instagram Story format...`);
                postPayload.instagramOptions = {
                    stories: true 
                };
            }
            
            // 3. Publish the Post using the unified scheduler
            const postResponse = await social.post(postPayload);

            // 4. Update Airtable to mark as sent
            await airtable(AIRTABLE_CONTENT_TABLE).update([
                {
                    id: recordId,
                    fields: {
                        "Posted": true, 
                        "AI Status": "Published",
                        "Post ID": postResponse.postIds ? postResponse.postIds.join(',') : 'N/A'
                    },
                },
            ]);

            console.log(`✅ Published to ${platform} as a ${postType}. Status updated in Airtable.`);

        } catch (error) {
            console.error(`❌ Failed to publish post ${recordId} to ${platform}.`, error.message);
        }
    }
}
// === FUNCTION C: GENERATE IMAGE USING DALL-E ===
async function generateImage(imageConcept, postType) {
    console.log(`\n    -> Generating image for: "${imageConcept}"`);
    
    // Set size based on Post Type
    // 'Story' requires 1024x1792 (vertical 9:16)
    // 'Feed Post' uses 1024x1024 (square)
    const size = (postType === 'Story') ? "1024x1792" : "1024x1024";
    
    const prompt = `Create a high-quality, professional image for an AI Automation Agency. The visual concept is: "${imageConcept}". Maintain a clean, high-tech, and professional aesthetic.`;

    try {
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: size,
            response_format: "url", 
        });

        const imageUrl = imageResponse.data[0].url;
        console.log(`    -> ✅ Image generated successfully.`);
        // Note: DALL-E URLs are temporary. This is fine for testing.
        return imageUrl; 

    } catch (error) {
        console.error("    -> ❌ DALL-E Image Generation Failed:", error.message);
        return null;
    }
}


// --- Main Workflow ---
async function main() {
    // 1. Generate content (consumes 1 OpenAI credit)
    //await generateAndStorePosts();

    // NOTE: A human must manually change the 'AI Status' in Airtable from 
    // 'Generated - Needs Review' to 'Ready to Post' before the next step will send it.
    
    // 2. Schedule and send content (consumes social scheduler credits)
    await scheduleAndSendPosts(); 
}

main();