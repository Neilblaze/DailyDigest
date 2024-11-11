# Daily Report Automation using OpenAI's GPT-4o-mini API and Google Sheets

This project automates the process of generating daily reports using OpenAI's GPT-4o-mini API and sending them via email. The reports are generated based on the data from a Google Sheet.

## Installation

create a .env file in the root directory of the project and add the following environment variables:

```bash
OPENAI_API_KEY=
EMAIL_USER=""
EMAIL_APP_PASSWORD=""
SPREADSHEET_ID=
TARGET_EMAIL=""
```

Also, you need to enable the Google Sheets API and download the credentials.json file from the Google Cloud Console. Place the file in the root directory of the project.

Set up a new project on Google Cloud Console, enable the Google Sheets API, create a service account, and download the JSON key file. Here are the detailed steps:

### Step 1: Go to Google Cloud Console
1. Open your web browser and go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account if you are not already signed in.

### Step 2: Create a New Project
1. In the Google Cloud Console, click on the project drop-down at the top of the page.
2. Click on the "New Project" button.
3. Enter a name for your project and click "Create."
4. Wait for the project to be created. This might take a few seconds.

### Step 3: Enable Google Sheets API in the Project
1. Once your project is created, select it from the project drop-down.
2. In the left-hand menu, navigate to "APIs & Services" > "Library."
3. In the search bar, type "Google Sheets API" and press Enter.
4. Click on the "Google Sheets API" from the search results.
5. Click the "Enable" button to enable the API for your project.

### Step 4: Go to "Credentials"
1. In the left-hand menu, navigate to "APIs & Services" > "Credentials."

### Step 5: Create a Service Account
1. Click on the "Create Credentials" button and select "Service account."
2. Enter a name for the service account and an optional description.
3. Click "Create and Continue."
4. Assign a role to the service account. For basic access, you can select "Project" > "Editor" or "Project" > "Owner." Click "Continue."
5. You can skip the optional step of granting users access to this service account. Click "Done."

### Step 6: Download the JSON Key File
1. After creating the service account, you will see it listed under "Service Accounts."
2. Click on the service account you just created.
3. Go to the "Keys" tab.
4. Click on "Add Key" and select "Create New Key."
5. Choose "JSON" as the key type and click "Create."
6. The JSON key file will be downloaded to your computer.

### Step 7: Rename and Place the JSON Key File
1. Locate the downloaded JSON key file on your computer.
2. Rename the file to `credentials.json`.
3. Move the `credentials.json` file to the root directory of your project.

### [Extras] Step 8: Share Google Sheet with Service Account Email 
1. Open the Google Sheet you want to access with the service account.
2. Click on the "Share" button in the top right corner.
3. Enter the email address of the service account (found in the `credentials.json` file) and click "Send."

<br/>

---

<br/>

## Start

Node: 

```bash
npm i && node index.js
```

OR, via PM2:


```bash
npm i && pm2 start index.js --name "daily-digest"

``` 

To stop the service, run:

```bash
pm2 stop daily-digest
pm2 kill
```

<br/>

---

<br/>

## Usage

The `cron_restart` field (in ecosystem config) allows you to specify a cron expression that defines when the script should be restarted. Int this case, the cron will let the service to restart **every day at 6:00 PM**.


Also, 

```bash
EMAIL_USER=""
EMAIL_APP_PASSWORD=""
```

Here the `EMAIL_USER` is the email address from which the reports will be sent and `EMAIL_APP_PASSWORD` is the app password generated from the gmail. 

To generate an app password, follow these steps:

1. Go to your Google Account.
2. Select "Security" from the left navigation panel.
3. Under "Signing in to Google", click on "App passwords."
4. You may need to sign in again (check if the 2-step verification is enabled or not).
5. At the bottom, choose Select app and then Mail.
6. Choose Select device and then Other (Custom name).
7. Enter a name, like "Daily Report Automation," and click Generate.
8. Follow the instructions to enter the App password (the 16 character code in the yellow bar) on your device.
9. Click Done.

For the Google form, you need to create it in a way that the data is stored in a Google Sheet. The script will then read the data from the Google Sheet and generate the daily reports.

Google Form Template:

1. Name (Full Name, Short Answer, Mandatory)
2. Email (Original, Short Answer, Mandatory)
3. Complaint (Long Answer <500words, Mandatory)

Go to `destination` of the form, and select the three dots, and click on `Select response destination`. Then select `Create a new spreadsheet` and click on `Create`. The timestamp will be stored in the first column of the Google Sheet.

<br/>

And finally, 

for `SPREADSHEET_ID=` and `TARGET_EMAIL=`, you need to provide the Google Sheet ID and the email address of the recipient respectively. Here the `SPREADSHEET_ID` is the ID of the Google Sheet.

For example, 

`https://docs.google.com/forms/d/SPREADSHEET_ID/edit`

---

⚡ **PRIVATE:** The `.env` file can be accessed here: [`.env`](https://drive.google.com/file/d/1MKNFASKdVhsa5Vy6kF9Sg1XTNcriyFlT/view?usp=drive_link), while the `credentials.json` file can be accessed here: [`credentials.json`](https://drive.google.com/file/d/15MjxUWkXBMO8dldvaqX_K7PcE1XfosbR/view?usp=drive_link).
