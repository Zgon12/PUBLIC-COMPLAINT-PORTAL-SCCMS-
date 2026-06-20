require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const CustomRequest = require('./models/CustomRequest');
const { sendCategoryEmail, sendCustomEmail } = require('./utils/mailer');

const app = express();

// Trust proxy for Vercel (required for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

const categoryDescriptions = {
    "0101": "Bus Timing Issues (Delays, Unreliable Schedule)",
    "0102": "Bus Overcrowding Issues",
    "0103": "Bus Cleanliness & Maintenance Issues",
    "0104": "Unsafe Driving & Staff Behavior Issues",
    "0105": "Lack of Transport Information & Communication",

    "0201": "Street Light Failure (Not Working)",
    "0202": "Insufficient Street Lighting",
    "0203": "Street Light Maintenance Delays",

    "0301": "Water Supply Issues (Shortage, Irregular Supply)",
    "0302": "Water Leakage / Pipeline Damage",
    "0303": "Poor Water Quality",

    "0401": "Garbage Collection Issues",
    "0402": "Improper Waste Disposal / Open Dumping",
    "0403": "Lack of Waste Management Infrastructure",

    "0501": "Road Damage (Potholes, Poor Condition)",
    "0502": "Poor Road Construction & Maintenance",
    "0503": "Road Flooding & Drainage Issues",
    "0504": "Footpath & Pedestrian Infrastructure Issues",

    "0601": "Blocked Drains & Drainage Overflow",
    "0602": "Poor Sewage Infrastructure",
    "0603": "Water Stagnation & Hygiene Issues",

    "0701": "Stray Animal Issues",
    "0702": "Noise Pollution Issues",
    "0703": "Public Obstructions & Hazards",
    "0704": "Public Safety Concerns",

    "0801": "Slow Government Services",
    "0802": "Corruption & Lack of Transparency",
    "0803": "Illegal Activities & Weak Enforcement"
};

// Note: File uploads are disabled on Vercel (read-only filesystem)

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serves your CSS/JS from the public folder

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 24 * 60 * 60 // Session TTL: 1 day
    }),
    cookie: {
        secure: process.env.VERCEL === '1', // true on Vercel (HTTPS), false locally
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// AI Classifier using Hugging Face Inference API (Vercel-compatible)
const classifyComplaint = async (text) => {
    const HF_TOKEN = process.env.HF_TOKEN;
    const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';

    // Define the candidate labels based on your category system
    const candidateLabels = [
        'bus timing delay transport schedule',
        'bus overcrowding',
        'bus cleanliness maintenance',
        'unsafe driving staff behavior',
        'transport information communication',
        'street light failure not working',
        'insufficient street lighting',
        'street light maintenance delay',
        'water supply shortage irregular',
        'water leakage pipeline damage',
        'poor water quality',
        'garbage collection issues',
        'improper waste disposal open dumping',
        'waste management infrastructure',
        'road damage potholes poor condition',
        'poor road construction maintenance',
        'road flooding drainage',
        'footpath pedestrian infrastructure',
        'blocked drains drainage overflow',
        'poor sewage infrastructure',
        'water stagnation hygiene',
        'stray animal issues',
        'noise pollution',
        'public obstructions hazards',
        'public safety concerns',
        'slow government services',
        'corruption lack of transparency',
        'illegal activities weak enforcement'
    ];

    const labelToCategory = {
        'bus timing delay transport schedule': '0101',
        'bus overcrowding': '0102',
        'bus cleanliness maintenance': '0103',
        'unsafe driving staff behavior': '0104',
        'transport information communication': '0105',
        'street light failure not working': '0201',
        'insufficient street lighting': '0202',
        'street light maintenance delay': '0203',
        'water supply shortage irregular': '0301',
        'water leakage pipeline damage': '0302',
        'poor water quality': '0303',
        'garbage collection issues': '0401',
        'improper waste disposal open dumping': '0402',
        'waste management infrastructure': '0403',
        'road damage potholes poor condition': '0501',
        'poor road construction maintenance': '0502',
        'road flooding drainage': '0503',
        'footpath pedestrian infrastructure': '0504',
        'blocked drains drainage overflow': '0601',
        'poor sewage infrastructure': '0602',
        'water stagnation hygiene': '0603',
        'stray animal issues': '0701',
        'noise pollution': '0702',
        'public obstructions hazards': '0703',
        'public safety concerns': '0704',
        'slow government services': '0801',
        'corruption lack of transparency': '0802',
        'illegal activities weak enforcement': '0803'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: text,
                parameters: { candidate_labels: candidateLabels }
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        const topLabel = result.labels[0];
        const secondLabel = result.labels[1];

        return {
            category: labelToCategory[topLabel] || 'UNKNOWN',
            secondCategory: labelToCategory[secondLabel] || 'UNKNOWN',
            message: `Top match: ${topLabel} (${(result.scores[0] * 100).toFixed(1)}%)`
        };
    } catch (err) {
        console.error('HuggingFace API Error:', err);
        throw err;
    }
};

// 3. Auth Gatekeeper (Protecting Routes)
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

// 4. Routes

// --- Protected Pages ---
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Admin Dashboard (Requires 'admin' role)
app.get('/admin', isAuthenticated, (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/admin-login'); // 🔥 better UX
    }

    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// --- Authentication Pages ---

// Citizen Login (The default gate)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Separate Admin Login Page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

// Logout Logic
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect('/login');
    });
});

// 5. Start Server
const PORT = process.env.PORT || 3000;
const { sendOTP } = require('./utils/mailer');
const User = require('./models/User');

app.post('/auth/send-otp', async (req, res) => {
    const { email } = req.body;

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save to Database (Upsert: update if exists, create if not)
    await User.findOneAndUpdate(
        { email },
        { otp, otpExpires: Date.now() + 600000 }, // 10 min expiry
        { upsert: true }
    );

    // 3. Send the Email
    const success = await sendOTP(email, otp);

    if (success) {
        // Redirect to verify page and pass the email in the URL
        res.redirect(`/verify?email=${email}`);
    } else {
        res.status(500).send('Error sending email.');
    }
});
app.get('/verify', (req, res) => {
    const email = req.query.email;

    let html = require('fs').readFileSync(
        path.join(__dirname, 'views', 'verify.html'),
        'utf8'
    );

    html = html.replace('{{email}}', email);

    res.send(html);
});
app.post('/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    // 1. Find the user in the database
    console.log("1. Data from Form:", req.body);
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        console.log("3. ERROR: No user found with that email.");
        return res.status(400).send('User not found.');
    }
    console.log("2. User found:", user.email);
    // ...

    // 2. Check if OTP matches and hasn't expired
    if (user.otp === otp && user.otpExpires > Date.now()) {

        // 3. SUCCESS! Create the Session "Pass"
        req.session.user = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        // Clear the OTP so it can't be used again
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        // 4. Send them to the protected Dashboard
        res.json({
            success: true
        });
    } else {
        res.status(400).send('Invalid or Expired OTP.');
    }
});

const Complaint = require('./models/Complaint');
const DeletedComplaint = require('./models/DeletedComplaint');

app.post('/analyze', async (req, res) => {

    console.log("📥 Received in /analyze:", req.body); // ✅ FIX 2 (TOP)

    const text = req.body?.text;

    if (!text) {
        return res.status(400).send('Text required');
    }

    try {
        const result = await classifyComplaint(text);
        res.json({
            category: result.category,
            secondCategory: result.secondCategory,
            message: result.message,
            description: categoryDescriptions[result.category] || "No description available"
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('AI failed');
    }
});

app.post('/custom-request', isAuthenticated, async (req, res) => {
    const { text, suggestedCategory, userSuggestion } = req.body;
    const email = req.session.user.email;

    try {
        const newRequest = new CustomRequest({
            text,
            suggestedCategory,
            userSuggestion,
            email,
            isCustom: true   // 🔥 ADD THIS
        });

        await newRequest.save();

        res.send("Request submitted for review");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to submit request");
    }
});

app.post('/submit-complaint', isAuthenticated, async (req, res) => {
    const text = req.body.text;
    const category = req.body.category;
    if (!text || !category) {
        return res.status(400).send('Missing complaint data');
    }
    const email = req.session.user.email;

    try {

        // 2. Generate Admin ID (sequence)
        const userID = category;

        const adminID =
            Date.now().toString().slice(-6) + category;

        // 3. Save to DB
        const newComplaint = new Complaint({
            email,
            text,
            category,
            adminID,
            userID
        });

        await newComplaint.save();

        // 4. Response
        res.json({
            userID: userID
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting complaint');
    }
});

app.get('/track-complaint/:id', isAuthenticated, async (req, res) => {

    const id = req.params.id;

    try {

        const complaints = await Complaint.find({
            $or: [
                { userID: id },
                { adminID: id },
                { category: id }
            ]
        });

        if (complaints.length === 0) {
            return res.status(404).send('No complaint found for this ID');
        }

        const complaint = complaints[0];

        res.json({
            category: complaint.category,
            description: categoryDescriptions[complaint.category] || "Custom complaint category",
            count: complaints.length,
            status: complaint.status
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error tracking complaint');
    }
});

app.delete('/delete-complaint/:id', isAuthenticated, async (req, res) => {

    const id = req.params.id;
    const email = req.session.user.email;

    try {

        const complaint = await Complaint.findOne({
            email,
            $or: [
                { userID: id },
                { adminID: id },
                { category: id }
            ]
        });

        if (!complaint) {
            return res.status(404).send('Complaint not found or not yours');
        }

        const deletedComplaint = new DeletedComplaint({
            email: complaint.email,
            text: complaint.text,
            category: complaint.category,
            userID: complaint.userID,
            adminID: complaint.adminID,
            image: complaint.image,
            status: complaint.status,
            deletedAt: new Date()
        });

        await deletedComplaint.save();

        await Complaint.deleteOne({
            _id: complaint._id
        });
        res.send('Complaint deleted successfully');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting complaint');
    }
});

app.post('/update-status', async (req, res) => {
    const { category, status } = req.body;

    try {
        await Complaint.updateMany(
            { category },
            { $set: { status } }
        );

        res.send("Status updated");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating status");
    }
});

// ---------------------------------- //
// -------   ADMIN MODULE    ---------//
// -----------------------------------//

app.post('/admin-login', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
        return res.status(403).send('Not an admin');
    }

    req.session.user = {
        id: user._id,
        email: user.email,
        role: user.role
    };

    res.redirect('/admin');
});

app.get('/admin-data', async (req, res) => {
    // 🔒 Admin protection
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Admins only');
    }

    try {
        const Complaint = require('./models/Complaint');

        // Group complaints by category
        const data = await Complaint.aggregate([
            {
                $match: { category: { $ne: "CUSTOM" } } // 🔥 EXCLUDE CUSTOM
            },
            {
                $group: {
                    _id: "$category",        // group by category
                    count: { $sum: 1 },     // number of complaints
                    status: { $first: "$status" } // take one status
                }
            },
            {
                $sort: { count: -1 } // highest complaints first 🔥
            }
        ]);

        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading admin data');
    }
});

app.get('/admin-custom-requests', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Admins only');
    }

    try {
        const requests = await CustomRequest.find({ status: "Pending" });
        res.json(requests);
    } catch (err) {
        res.status(500).send("Error fetching requests");
    }
});

app.post('/handle-custom-request', async (req, res) => {
    const { id, action, finalCategory } = req.body;

    try {
        const request = await CustomRequest.findById(id);

        if (!request) {
            return res.status(404).send("Request not found");
        }

        const email = request.email || "test@example.com"; // fallback

        // =========================
        // ✅ CASE 1: NORMAL CATEGORY
        // =========================
        if (action === "Accepted") {
            if (!finalCategory) {
                return res.status(400).send("Category required");
            }

            const count = await Complaint.countDocuments({ category: finalCategory });
            const sequence = String(count + 1).padStart(4, '0');
            const adminID = sequence + finalCategory;

            const newComplaint = new Complaint({
                email,
                text: request.text,
                category: finalCategory,
                adminID,
                userID: finalCategory,
                isCustom: false
            });

            await newComplaint.save();

            // 📧 Send category email
            await sendCategoryEmail(email, finalCategory);
        }

        // =========================
        // 🟡 CASE 2: CUSTOM
        // =========================
        if (action === "Custom") {
            const count = await Complaint.countDocuments({ category: "CUSTOM" });
            const sequence = String(count + 1).padStart(4, '0');

            const adminID = "CUSTOM" + sequence;
            const userID = sequence;

            const newComplaint = new Complaint({
                email,
                text: request.text,
                category: "CUSTOM",
                adminID,
                userID,
                isCustom: true
            });
            console.log("🔥 Custom flow triggered for:", email);

            await newComplaint.save();

            // 📧 Send custom email
            console.log("📧 Sending custom email...");
            await sendCustomEmail(email, userID);
        }

        request.status = action;
        request.finalCategory = finalCategory || null;
        await request.save();

        res.send("Updated");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get('/admin-custom-complaints', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Admins only');
    }

    try {
        const data = await Complaint.find({ category: "CUSTOM" });
        res.json(data);
    } catch (err) {
        res.status(500).send("Error fetching custom complaints");
    }
});

app.get('/deleted-complaints', async (req, res) => {

    try {

        const deletedComplaints =
            await DeletedComplaint.find()
                .sort({ deletedAt: -1 });

        res.json(deletedComplaints);

    } catch (err) {

        console.error(err);
        res.status(500).send('Error loading deleted complaints');

    }
});

// Only listen when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

// Export for Vercel serverless
module.exports = app;