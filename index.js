require('dotenv').config();
const { google } = require('googleapis');
const OpenAI = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    },
    timeout: 10000
});

function parseDate(dateString) {
    const dateParts = dateString.split(/[\s/]+/);
    
    // Check mm/dd/yyyy
    if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2) {
        const month = parseInt(dateParts[0], 10) - 1; // Months are 0-based
        const day = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        return new Date(year, month, day);
    }
    
    // dd/mm/yyyy
    if (dateParts.length < 3) {
        return null;
    }
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    const timeParts = dateParts.slice(3);
    const hours = timeParts.length > 0 ? parseInt(timeParts[0], 10) : 0;
    const minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
    const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
}

async function getComplaintsFromSheet() {
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });

        console.log('Sheet properties:', spreadsheet.data.sheets[0].properties);

        const sheetName = spreadsheet.data.sheets[0].properties.title;

        console.log('Using sheet name:', sheetName);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${sheetName}!A:D`,
        });

        console.log('Raw response data:', response.data);

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found in sheet');
            return [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('Looking for complaints from:', today.toLocaleDateString());

        const complaints = rows.filter(row => {
            if (!row[0]) {
                console.log('Skipping row with no timestamp ...');
                return false;
            }

            const timestamp = parseDate(row[0]);
            if (!timestamp) {
                console.log(`Skipping row with invalid date: ${row[0]}`);
                return false;
            }

            const rowDate = new Date(timestamp);
            rowDate.setHours(0, 0, 0, 0);

            console.log('Comparing dates:', {
                rowDate: rowDate.toLocaleDateString(),
                today: today.toLocaleDateString(),
                matches: rowDate.getTime() === today.getTime()
            });

            return rowDate.getTime() === today.getTime();
        }).map(row => ({
            timestamp: row[0],
            name: row[1],
            email: row[2],
            complaint: row[3]
        }));

        console.log('Filtered complaints:', complaints);
        return complaints;

    } catch (error) {
        if (error.errors && error.errors[0]) {
            console.error('Specific error:', error.errors[0].message);
        }
        if (error.response && error.response.data) {
            console.error('Response data:', error.response.data);
        }
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
}

async function analyzeComplaints(complaints) {
    const complaintsText = complaints.map(c => c.complaint).join('\n');

    try {
        console.log('Starting AI analysis...');

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "system",
                content: `Create a daily digest of mess management complaints. Include:
                Total number of complaints received today: ${complaints.length}
                <br/>
                1. Critical issues requiring immediate attention
                2. Common patterns in today's complaints
                3. Specific actionable recommendations
                4. Brief statistical breakdown of complaint types
                <br/>
                TL;DR summary of the analysis (be precise and to the point, and use TL;DR as the header)
                Format the analysis in a clear, concise manner suitable for quick reading. The output should be in html format and not markdown. Leverage unorder list (bullets) to order and use emojis to show emphasis.`
            }, {
                role: "user",
                content: `Daily Complaints Analysis (${new Date().toLocaleDateString()}):\n\n${complaintsText}`
            }],
        });

        const analysis = completion.choices[0].message.content;
        console.log('Analysis generated 🔥');
        // console.log('Analysis generated 🔥:', analysis);

        return analysis;
    } catch (error) {
        console.error('Error analyzing complaints:', error);
        if (error.response) {
            console.error('API response:', error.response.data);
        }
        console.error(error.message);
        return null;
    }
}

async function sendEmail(analysis, complaints) {
    const today = new Date().toLocaleDateString();

    console.log('Preparing to send email...');
    console.log('From:', process.env.EMAIL_USER);
    console.log('To:', process.env.TARGET_EMAIL);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.TARGET_EMAIL,
        subject: `Mess Management Daily Digest - ${today}`,
        html: analysis,
        text: `Daily Mess Management Analysis\nDate: ${today}\nTotal Complaints: ${complaints.length}\n\n${analysis.replace(/<[^>]+>/g, '')}`
    };

    try {
        console.log('Verifying email transporter...');
        await transporter.verify();

        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        throw error;
    }
}

async function main() {
    console.log('Starting daily analysis...');

    try {
        const complaints = await getComplaintsFromSheet();
        console.log(`Found ${complaints.length} complaints for today`);

        if (complaints.length > 0) {
            const analysis = await analyzeComplaints(complaints);

            if (analysis) {
                try {
                    await sendEmail(analysis, complaints);
                    console.log('Daily analysis completed and sent');
                } catch (emailError) {
                    console.error('Failed to send email:', emailError.message);
                    console.log('Analysis result (since email failed):', analysis);
                }
            } else {
                console.log('No analysis was generated');
            }
        } else {
            console.log('No complaints found for today!');
        }
    } catch (error) {
        console.error('Error in main function:', error);
        console.error(error.message);
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
