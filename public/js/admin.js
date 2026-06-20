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

async function loadAdminData() {
    const res = await fetch('/admin-data', {
        credentials: 'include'
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("Server returned:", text);
        document.getElementById('adminData').innerText = "Failed to load data";
        return;
    }

    const data = await res.json();

    // Prepare data for chart
    const labels = data.map(item => item._id);
    const counts = data.map(item => item.count);

    // Draw chart
    const ctx = document.getElementById('chart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Complaints per Category',
                data: counts
            }]
        }
    });

    let html = "";

    data.forEach(item => {
        html += `
            <div style="border:1px solid black; margin:10px; padding:10px;">
                <b>Category: ${item._id} <br>
📝 ${categoryDescriptions[item._id] || "No description"} <br>
                <b>Complaints:</b> ${item.count} <br>
                <b>Status:</b> ${item.status} <br><br>

                <button onclick="updateStatus('${item._id}', 'Pending')">Pending</button>
<button onclick="updateStatus('${item._id}', 'In Progress')">Working</button>
<button onclick="updateStatus('${item._id}', 'Completed')">Resolved</button>
            </div>
        `;
    });

    document.getElementById('adminData').innerHTML = html;
    const deletedRes =
        await fetch('/deleted-complaints');

    const deletedData =
        await deletedRes.json();

    let deletedHtml = "";

    deletedData.forEach(item => {

        deletedHtml += `
        <div style="border:1px solid red;
                    margin:10px;
                    padding:10px;">

            <b>Text:</b> ${item.text}<br>

            <b>Category:</b> ${item.category}<br>

            <b>Email:</b> ${item.email}<br>

            <b>Tracking ID:</b>
            ${item.userID || item.adminID}<br>

            <b>Deleted At:</b>
            ${new Date(item.deletedAt)
                .toLocaleString()}

        </div>
        `;
    });

    document.getElementById(
        'deletedComplaints'
    ).innerHTML = deletedHtml;
}



async function loadCustomRequests() {
    const res = await fetch('/admin-custom-requests', {
        credentials: 'include'
    });

    const data = await res.json();

    let html = "";

    data.forEach(req => {
        html += `
    <div style="border:1px solid red; margin:10px; padding:10px;">
        <b>Complaint:</b> ${req.text} <br>
        <b>AI Category:</b> ${req.suggestedCategory} <br>
        <b>User Suggestion:</b> ${req.userSuggestion} <br><br>

        <input type="text" id="cat-${req._id}" placeholder="Enter category (e.g. 0201)">
        <br><br>

        <button onclick="acceptRequest('${req._id}')">Accept</button>
        <button onclick="markCustom('${req._id}')">Mark as Custom</button>
        <button onclick="handleRequest('${req._id}', 'Rejected')">Reject</button>
    </div>
`;
    });

    document.getElementById('customRequests').innerHTML = html;
}

async function loadCustomComplaints() {
    const res = await fetch('/admin-custom-complaints', {
        credentials: 'include'
    });

    const data = await res.json();

    let html = "";

    data.forEach(item => {
        html += `
            <div style="border:1px solid orange; margin:10px; padding:10px;">
                <b>Text:</b> ${item.text} <br>
                <b>Tracking ID:</b> ${item.userID} <br>
                <b>Status:</b> ${item.status}
            </div>
        `;
    });

    document.getElementById('customComplaints').innerHTML = html;
}

async function handleRequest(id, action) {
    await fetch('/handle-custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
    });

    alert("Updated");
    loadCustomRequests();
}

async function acceptRequest(id) {
    const finalCategory = document.getElementById(`cat-${id}`).value;

    if (!finalCategory) {
        alert("Enter category");
        return;
    }

    await fetch('/handle-custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id,
            action: "Accepted",
            finalCategory
        })
    });

    alert("Accepted and categorized");
    loadCustomRequests();
}

async function updateStatus(category, status) {
    const res = await fetch('/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, status })
    });

    const msg = await res.text();
    alert(msg);

    loadAdminData(); // refresh UI
}

async function markCustom(id) {
    await fetch('/handle-custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id,
            action: "Custom"
        })
    });

    alert("Marked as custom");
    loadCustomRequests();
}

loadAdminData();
loadCustomRequests();
loadCustomComplaints();  // 🔥 ADD THIS