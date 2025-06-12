const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load existing .env variables if any
dotenv.config();

const envPath = path.resolve(__dirname, '.env');
const KEY_NAME = 'JWT_SECRET'; // Nama variabel yang akan disimpan di .env

// Function to generate a strong random string
function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Generate a new secret key (e.g., 64 characters long)
const newSecret = generateRandomString(64);

// Read the current .env file content
let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// Check if JWT_SECRET already exists in the .env content
if (envContent.includes(`${KEY_NAME}=`)) {
    // If it exists, replace its value
    envContent = envContent.replace(new RegExp(`^${KEY_NAME}=.*`, 'gm'), `${KEY_NAME}=${newSecret}`);
    console.log(`✅ ${KEY_NAME} updated in .env`);
} else {
    // If it doesn't exist, append it to the end of the file
    envContent += `\n${KEY_NAME}=${newSecret}`;
    console.log(`✅ ${KEY_NAME} added to .env`);
}

// Write the updated content back to the .env file
fs.writeFileSync(envPath, envContent.trim() + '\n'); // .trim() to remove leading/trailing whitespace
console.log(`Your new JWT_SECRET has been generated and saved to ${envPath}`);
console.log(`Make sure to restart your server to use the new secret.`);