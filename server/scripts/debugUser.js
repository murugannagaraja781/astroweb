require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const id = '692826f79aafa7e54e874217';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        console.log('Querying for ID:', id);
        const user = await User.findById(id);
        console.log('Result:', user);

        if (user) {
            console.log('User ID type:', typeof user._id);
            console.log('User ID constructor:', user._id.constructor.name);
        } else {
            console.log('User not found via findById');
        }

        // Try finding by string match if findById fails
        const allUsers = await User.find({});
        console.log('Total users:', allUsers.length);
        allUsers.forEach(u => console.log(`ID: ${u._id} (Type: ${typeof u._id}) Role: ${u.role} Name: ${u.name}`));

        const match = allUsers.find(u => u._id.toString() === id);
        if (match) {
            console.log('Found via manual string comparison:', match);
        } else {
            console.log('Not found via manual string comparison');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
