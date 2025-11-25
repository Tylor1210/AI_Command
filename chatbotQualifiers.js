// chatbotQualifier.js - Now with Instant Email Alerts

require('dotenv').config();
const Airtable = require('airtable');
const nodemailer = require('nodemailer'); // NEW IMPORT

// --- Initialize Clients ---
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
    process.env.AIRTABLE_BASE_ID
);

// Configuration
const AIRTABLE_LEADS_TABLE = "Qualified Leads"; // Ensure this matches your table name
const SENDER_EMAIL = process.env.ALERT_EMAIL_USER;
const SENDER_PASS = process.env.ALERT_EMAIL_PASS;
const RECEIVER_EMAIL = process.env.ALERT_RECEIVING_EMAIL;

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASS
    }
});

/**
 * Sends an email alert for a hot lead.
 * @param {object} leadData - The qualified lead's data.
 */
async function sendLeadAlert(leadData) {
    const mailOptions = {
        from: SENDER_EMAIL,
        to: RECEIVER_EMAIL,
        subject: `🚨 HOT LEAD ALERT: ${leadData.name} - Ready to Call! 📞`,
        html: `
            <h2>Qualified Lead Details - Action Required!</h2>
            <p><strong>Lead Name:</strong> ${leadData.name}</p>
            <p><strong>Contact Info:</strong> ${leadData.contact}</p>
            <p><strong>Budget:</strong> ${leadData.budget || 'Not specified'}</p>
            <p style="color: green; font-weight: bold;">Status: ${leadData.status}</p>
            <hr>
            <p>Login to Airtable to begin outreach: [Link to your Airtable Base]</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Alert Email sent successfully to ${RECEIVER_EMAIL}`);
    } catch (error) {
        console.error("❌ Error sending email alert:", error.message);
    }
}


/**
 * Main function to simulate reading qualified lead data and trigger alerts.
 * NOTE: In a real app, this data would come directly from your live chatbot.
 */
async function processQualifiedLeads() {
    console.log("--- Checking for newly qualified leads... ---");
    
    // 1. Simulate new data received from a chatbot (e.g., a webhook payload)
    const newLeadData = {
        name: "Acme Corp Demo Request",
        contact: "demo@acmecorp.com",
        budget: "$5,000 / month",
        status: "New Qualified" // This must match your Airtable Single Select Option
    };
    
    // 2. Push the new lead record to Airtable (like your script would do)
    let createdRecord;
    try {
        const records = await airtable(AIRTABLE_LEADS_TABLE).create([{
            fields: {
                "Name": newLeadData.name,
                "Contact": newLeadData.contact,
                "Budget": newLeadData.budget,
                "Lead Status": newLeadData.status
            }
        }]);
        createdRecord = records[0];
        console.log(`✅ New Lead: ${newLeadData.name} saved to Airtable.`);
    } catch (error) {
        console.error("❌ Error saving lead to Airtable:", error.message);
        return;
    }
    
    // 3. Check qualification and send alert
    if (newLeadData.status === "New Qualified") {
        await sendLeadAlert(newLeadData);
    }
    
    console.log("--- Lead processing complete ---");
}

processQualifiedLeads();