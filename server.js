require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Airtable = require('airtable');
const { generateAndStorePosts, scheduleAndSendPosts } = require('./contentGenerator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Initialize Airtable
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
    process.env.AIRTABLE_BASE_ID
);
const AIRTABLE_CONTENT_TABLE = "Social Media Posts";

// ====================================
// ENDPOINT 1: Generate New Posts with AI
// ====================================
app.post('/api/generate-posts', async (req, res) => {
    console.log('📝 API Request: Generate new posts...');
    
    try {
        const count = await generateAndStorePosts();
        res.json({ 
            success: true, 
            message: `Successfully generated ${count} new post(s)!`,
            count: count
        });
    } catch (error) {
        console.error('❌ Error generating posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate posts',
            error: error.message 
        });
    }
});

// ====================================
// ENDPOINT 2: Publish Ready Posts
// ====================================
app.post('/api/publish-posts', async (req, res) => {
    console.log('📤 API Request: Publish ready posts...');
    
    try {
        await scheduleAndSendPosts();
        res.json({ 
            success: true, 
            message: 'Publishing process completed!'
        });
    } catch (error) {
        console.error('❌ Error publishing posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to publish posts',
            error: error.message 
        });
    }
});

// ====================================
// ENDPOINT 3: Get All Posts from Airtable
// ====================================
app.get('/api/posts', async (req, res) => {
    console.log('📋 API Request: Fetch all posts...');
    
    try {
        const records = await airtable(AIRTABLE_CONTENT_TABLE)
            .select({
                maxRecords: 100,
                sort: [{ field: "Created", direction: "desc" }]
            })
            .firstPage();

        const posts = records.map(record => ({
            id: record.id,
            caption: record.get('Caption'),
            platform: record.get('Platform'),
            postType: record.get('Post Type'),
            imageConcept: record.get('Image Concept'),
            imageUrl: record.get('Image URL'),
            aiStatus: record.get('AI Status'),
            isRecurring: record.get('Is Recurring') || false,
            repeatDay: record.get('Repeat Day') || 'N/A',
            posted: record.get('Posted') || false,
            postId: record.get('Post ID') || null,
            imageOptions: record.get('Image Options') || []
        }));

        res.json({ 
            success: true, 
            posts: posts,
            count: posts.length
        });
    } catch (error) {
        console.error('❌ Error fetching posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch posts',
            error: error.message 
        });
    }
});

// ====================================
// ENDPOINT 4: Update Post Status
// ====================================
app.patch('/api/posts/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 API Request: Update post ${id} status to ${status}...`);
    
    try {
        await airtable(AIRTABLE_CONTENT_TABLE).update([
            {
                id: id,
                fields: {
                    "AI Status": status
                }
            }
        ]);

        res.json({ 
            success: true, 
            message: `Post status updated to: ${status}`
        });
    } catch (error) {
        console.error('❌ Error updating post status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update post status',
            error: error.message 
        });
    }
});

// ====================================
// ENDPOINT 5: Update Entire Post
// ====================================
app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const postData = req.body;
    
    console.log(`✏️ API Request: Update post ${id}...`);
    
    try {
        const updateFields = {
            "Caption": postData.caption,
            "Image Concept": postData.imageConcept,
            "Image URL": postData.imageUrl,
            "Platform": postData.platform,
            "Post Type": postData.postType,
            "AI Status": postData.aiStatus,
            "Is Recurring": postData.isRecurring,
            "Repeat Day": postData.repeatDay
        };

        if (postData.imageOptions) {
            updateFields["Image Options"] = JSON.stringify(postData.imageOptions);
        }

        await airtable(AIRTABLE_CONTENT_TABLE).update([
            {
                id: id,
                fields: updateFields
            }
        ]);

        res.json({ 
            success: true, 
            message: 'Post updated successfully!'
        });
    } catch (error) {
        console.error('❌ Error updating post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update post',
            error: error.message 
        });
    }
});

// ====================================
// ENDPOINT 6: Create Manual Post
// ====================================
app.post('/api/posts', async (req, res) => {
    const postData = req.body;
    
    console.log('➕ API Request: Create new manual post...');
    
    try {
        const records = await airtable(AIRTABLE_CONTENT_TABLE).create([
            {
                fields: {
                    "Caption": postData.caption,
                    "Platform": postData.platform,
                    "Post Type": postData.postType,
                    "Image Concept": postData.imageConcept || "Manual post - no AI concept",
                    "Image URL": postData.imageUrl || "https://placehold.co/1024x1024/333333/ffffff?text=Manual+Post",
                    "AI Status": "Generated - Needs Review",
                    "Is Recurring": postData.isRecurring || false,
                    "Repeat Day": postData.repeatDay || "N/A"
                }
            }
        ]);

        res.json({ 
            success: true, 
            message: 'Manual post created successfully!',
            postId: records[0].id
        });
    } catch (error) {
        console.error('❌ Error creating manual post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create manual post',
            error: error.message 
        });
    }
});

// ====================================
// ENDPOINT 7: Delete/Archive Post
// ====================================
app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    
    console.log(`🗑️ API Request: Archive post ${id}...`);
    
    try {
        await airtable(AIRTABLE_CONTENT_TABLE).update([
            {
                id: id,
                fields: {
                    "AI Status": "Archived"
                }
            }
        ]);

        res.json({ 
            success: true, 
            message: 'Post archived successfully!'
        });
    } catch (error) {
        console.error('❌ Error archiving post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to archive post',
            error: error.message 
        });
    }
});

// ====================================
// Health Check Endpoint
// ====================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'AI Automation API Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`\n Available Endpoints:`);
    console.log(`  POST   /api/generate-posts      - Generate new AI posts`);
    console.log(`  POST   /api/publish-posts       - Publish ready posts`);
    console.log(`  GET    /api/posts               - Get all posts`);
    console.log(`  POST   /api/posts               - Create manual post`);
    console.log(`  PUT    /api/posts/:id           - Update post`);
    console.log(`  PATCH  /api/posts/:id/status    - Update post status`);
    console.log(`  DELETE /api/posts/:id           - Archive post`);
    console.log(`\n`);
});