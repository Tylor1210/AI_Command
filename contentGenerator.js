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
const TARGET_TOPIC = "New tax changes affecting small business owners.";
const TARGET_INDUSTRY = "Small local accounting firms."; 


// === FUNCTION A: GENERATE NEW CONTENT & PUSH TO AIRTABLE ===
async function generateAndStorePosts() {
    console.log(`\n[1/2] Generating and storing content for: "${TARGET_TOPIC}"...`);

    // NOTE: This uses one precious API call! 
    const systemPrompt = `You are a social media marketing expert for ${TARGET_INDUSTRY}. Generate three unique social media posts for the topic: "${TARGET_TOPIC}". Structure the posts in a strict JSON array with the properties: platform (LinkedIn, Instagram, X), caption, and imageConcept.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const jsonOutput = JSON.parse(response.choices[0].message.content);
        const postsArray = jsonOutput.posts || [];

        if (postsArray.length === 0) {
            console.log("❌ AI did not return a valid list of posts.");
            return;
        }

        // Prepare records for Airtable
        const recordsToCreate = postsArray.map(post => ({
            fields: {
                "Caption": post.caption,
                "Platform": post.platform,
                "Image Concept": post.imageConcept,
                "AI Status": "Generated - Needs Review" 
            }
        }));

        await airtable(AIRTABLE_CONTENT_TABLE).create(recordsToCreate);
        console.log(`✅ ${recordsToCreate.length} new posts pushed to Airtable for review!`);
        return recordsToCreate.length;

    } catch (error) {
        console.error("❌ Error during content generation or Airtable push:", error.message);
        return 0;
    }
}


// === FUNCTION B: SCHEDULE POSTS READY TO SEND ===
async function scheduleAndSendPosts() {
    console.log("\n[2/2] Checking Airtable for posts ready to schedule...");

    // Airtable filter formula: Filter posts where Status is 'Ready to Post' 
    // AND the 'Posted' checkbox is NOT checked (false)
    const records = await airtable(AIRTABLE_CONTENT_TABLE)
        .select({
            filterByFormula: "AND({AI Status} = 'Ready to Post', {Posted} != TRUE())",
            maxRecords: 5 // Limit to 5 to conserve scheduler credits
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
        const recordId = record.id;
        
        try {
            // Check if the post is marked 'Ready to Post' (Human-in-the-Loop check)
            if (record.get('AI Status') !== 'Ready to Post') continue; 

            // 1. Publish the Post using the unified scheduler
            const postResponse = await social.post({
                post: caption,
                platforms: [platform.toLowerCase()] 
            });

            // 2. Update Airtable to mark as sent
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

            console.log(`✅ Published to ${platform}. Status updated in Airtable.`);

        } catch (error) {
            console.error(`❌ Failed to publish post ${recordId} to ${platform}.`, error.message);
        }
    }
}


// --- Main Workflow ---
async function main() {
    // 1. Generate content (consumes 1 OpenAI credit)
    await generateAndStorePosts();

    // NOTE: A human must manually change the 'AI Status' in Airtable from 
    // 'Generated - Needs Review' to 'Ready to Post' before the next step will send it.
    
    // 2. Schedule and send content (consumes social scheduler credits)
    await scheduleAndSendPosts(); 
}

main();