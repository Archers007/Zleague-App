const express = require('express');
const app = express();
const port = 9999; // You can use any port you prefer
const fs = require('fs');
const requests = require('requests');

function aleart_on_payment(Content){
    const auth = "NTkzMjMyOTM4ODcxNTU0MDQ4.GZJroz.jGKEGkjFmSDhpYLTpqwTdCUblg8ApgnB4ercPM";
    const payload = {
        'content': Content
    };
    const headers = {
        'Authorization': `${auth}`, // You should use 'Bot' before your token if it's a bot token
        'Content-Type': 'application/json'
    };

    fetch('https://discord.com/api/v9/channels/763581379597828117/messages', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            console.log('Message sent successfully.');
        } else {
            console.error('Failed to send message.');
        }
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

// Middleware to parse JSON data from requests
app.use(express.json());

// Define your login credentials
const validUsername = 'Rinzler';
const validPassword = 'User1';

app.get('/', (req, res) => {
    // res.send('Hello World!');
    res.sendFile(__dirname + '/index.html');
});

// Define a route to handle login requests
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === validUsername && password === validPassword) {
        res.status(200).json({ message: 'Login successful', status: 200 });
    } else {
        res.status(401).json({ message: 'Please Log In' });
    }
});

app.get('/Admin', (req, res) => {
    res.sendFile(__dirname + '/Admin.html');
});

app.get('/purchases', (req, res) => {
    // open the payment_events.json file and for each event, display in an html box then return the html
    const json = fs.readFileSync('./payment_events.json');
    const events = JSON.parse(json);
    let html = '';
    html += `
        <style>
            .purchases {
                background-color: #fff;
                color: #000;
                padding: 1rem;
                box-shadow: 0 0 10px #0ff; /* Light blue box shadow */
                border: 2px solid #0ff;
                border-radius: 10px;
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;
                font-family: sans-serif;
            }
            .purchases:hover {
                cursor: pointer;
                background-color: #0ff;
                color: #000;
            }
            body {
                background-color: black;
            }
        </style>
        <script>
            function openPurchase(uid) {
                location.href = '/purchases/' + uid;
            }
        </script>
    `;
    
    for (let i = 0; i < events.length; i++) {
        html += `
            <div class="purchases" onclick="openPurchase('${events[i].uid}')">
                <div><strong>UID:</strong> ${events[i].uid}</div>
                <div><strong>Amount:</strong> ${events[i].amount}</div>
                <div><strong>Currency:</strong> ${events[i].currency}</div>
                <div><strong>Game:</strong> ${events[i].game}</div>
                <div><strong>Is Paid:</strong> ${events[i].isPaid}</div>
                <div><strong>Date:</strong> ${events[i].date}</div>
                <div><strong>Username:</strong> ${events[i].username}</div>
            </div>
        `;
    }
    res.send(html);
});

app.get('/cards', (req, res) => {
    // open the payment_events.json file and for each event, display in an html box then return the html
    const json = fs.readFileSync('./cards.json');
    const events = JSON.parse(json);
    let html = '';
    html += `
        <style>
            .purchases {
                background-color: #fff;
                color: #000;
                padding: 1rem;
                box-shadow: 0 0 10px #0ff; /* Light blue box shadow */
                border: 2px solid #0ff;
                border-radius: 10px;
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;
                font-family: sans-serif;
            }
            .purchases:hover {
                cursor: pointer;
                background-color: #0ff;
                color: #000;
            }
            body {
                background-color: black;
            }
        </style>
        <script>
            function openPurchase(uid) {
                location.href = '/cards/' + uid;
            }
        </script>
    `;
    
    for (let i = 0; i < events.length; i++) {
        html += `
            <div class="purchases" onclick="openPurchase('${events[i].uid}')">
                <div><strong>UID:</strong> ${events[i].uid}</div>
                <div><strong>Card Details:</strong> ${events[i].card_details}</div>
                <div><strong>Card Experation:</strong> ${events[i].card_expiery}</div>
                <div><strong>Card CVV:</strong> ${events[i].card_cvv}</div>
                <div><strong>Card Type:</strong> ${events[i].card_type}</div>
                <div><strong>Holders Name:</strong> ${events[i].full_name}</div>
                <div><strong>Address:</strong> ${events[i].address}</div>
            </div>
        `;
    }
    res.send(html);
});

app.get('/purchases/:uid', (req, res) => {
    const events = JSON.parse(fs.readFileSync('./payment_events.json'));
    const event = events.find(event => event.uid === req.params.uid);
    if (!event) return res.status(404).send('The event with the given UID was not found.');

    // Generate the HTML for displaying customer information with the provided styling
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${event.uid}'s Information</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    width: 30%;
                    padding: 20px;
                    background-color: #000;
                    border: 1px solid #0ff;
                    border-radius: 5px;
                    box-shadow: 0 0 20px #0ff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                h1 {
                    text-align: center;
                    color: #0ff;
                }
                div {
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                strong {
                    font-weight: bold;
                    color: #0ff;
                    flex: 1;
                    text-align: right;
                    padding-right: 10px;
                    padding-left: 10px;
                }
                .change-info {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .change-info input[type="text"], input[type="date"] {
                    width: 50%; /* Shorten the input fields */
                    padding: 5px;
                    border: 1px solid #0ff;
                    background-color: #000;
                    color: #0ff;
                    border-radius: 3px;
                }
                .change-info button {
                    padding: 5px;
                    background-color: rgba(0, 255, 255, 0.5);
                    color: #000;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                .change-info button:hover {
                    background-color: rgba(36, 255, 233, 0.742);
                }

                .button a{
                    background-color: #fff;
                    color: #000;
                    padding: 1rem;
                    box-shadow: 0 0 10px #0ff; /* Light blue box shadow */
                    border: 2px solid #0ff;
                    border-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    font-family: sans-serif;
                }
                a {
                    padding-left: 10px;
                    padding-right: 30px;
                    color: #fff;
                    text-decoration: none;
                    display: block;
                }
            </style>
            <script>
                function handleButtonClick(field, value) {
                    const inputField = document.getElementById(field);
                    const inputValue = inputField.value;
                    if (inputValue) {
                        // Send a POST request to update the data
                        fetch(\`/purchases/${event.uid}/edit/\${inputField.id}/\${inputValue}\`, {
                            method: 'POST',
                        })
                        .then(response => {
                            if (response.status === 200) {
                                if(field === 'uid'){
                                    window.location.href = \`/purchases/\${inputValue}\`
                                }else{
                                    window.location.reload();
                                }
                                alert('Data updated successfully.');
                            } else {
                                alert('Error updating data.');
                            }
                        });
                    } else {
                        alert('Please enter a value to update the data.');
                    }
                }
            </script>
        </head>
        <body>
            <h1>${event.uid}'s Information</h1>
            <div class="container">
                <div>
                    <strong>UID:</strong> <a>${event.uid}</a>
                    <div class="change-info">
                        <input id="uid" type="text" placeholder="Change UID" />
                        <button onclick="handleButtonClick('uid')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Amount:</strong> <a>${event.amount}</a>
                    <div class="change-info">
                        <input id="amount" type="text" placeholder="Change Amount" />
                        <button onclick="handleButtonClick('amount')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Currency:</strong> <a>${event.currency}</a>
                    <div class="change-info">
                        <input id="currency" type="text" placeholder="Change Currency" />
                        <button onclick="handleButtonClick('currency')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Game:</strong> <a>${event.game}</a>
                    <div class="change-info">
                        <input id="game" type="text" placeholder="Change Game" />
                        <button onclick="handleButtonClick('game')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Is Paid:</strong> <a>${event.isPaid}</a>
                    <div class="change-info">
                        <input id="isPaid" type="text" placeholder="Change Is Paid" />
                        <button onclick="handleButtonClick('isPaid')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Date:</strong> <a>${event.date}</a>
                    <div class="change-info">
                        <input id="date" type="date" placeholder="Change Date" />
                        <button onclick="handleButtonClick('date')">Change</button>
                    </div>
                </div>
            </div>
            <a stytle="background-color: #fff;color: #000;padding: 1rem;box-shadow: 0 0 10px #0ff;border: 2px solid #0ff;" href="/purchases">Back to Purchases</a>
        </body>
        </html>
    `;
    res.send(html);
});

app.get('/cards/:uid', (req, res) => {
    const events = JSON.parse(fs.readFileSync('./cards.json'));
    const event = events.find(event => event.uid === req.params.uid);
    if (!event) return res.status(404).send('The event with the given UID was not found.');

    // Generate the HTML for displaying customer information with the provided styling
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${event.uid}'s Information</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    width: 40%;
                    padding: 20px;
                    background-color: #000;
                    border: 1px solid #0ff;
                    border-radius: 5px;
                    box-shadow: 0 0 20px #0ff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                h1 {
                    text-align: center;
                    color: #0ff;
                }
                div {
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                strong {
                    font-weight: bold;
                    color: #0ff;
                    flex: 1;
                    text-align: right;
                    padding-right: 10px;
                    padding-left: 10px;
                }
                .change-info {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .change-info input[type="text"], input[type="date"] {
                    width: 50%; /* Shorten the input fields */
                    padding: 5px;
                    border: 1px solid #0ff;
                    background-color: #000;
                    color: #0ff;
                    border-radius: 3px;
                }
                .change-info button {
                    padding: 5px;
                    background-color: rgba(0, 255, 255, 0.5);
                    color: #000;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                .change-info button:hover {
                    background-color: rgba(36, 255, 233, 0.742);
                }

                .button a{
                    background-color: #fff;
                    color: #000;
                    padding: 1rem;
                    box-shadow: 0 0 10px #0ff; /* Light blue box shadow */
                    border: 2px solid #0ff;
                    border-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    font-family: sans-serif;
                }
                a {
                    padding-left: 10px;
                    padding-right: 30px;
                    color: #fff;
                    text-decoration: none;
                    display: block;
                }
            </style>
            <script>
                function handleButtonClick(field, value) {
                    const inputField = document.getElementById(field);
                    const inputValue = inputField.value;
                    if (inputValue) {
                        // Send a POST request to update the data
                        fetch(\`/purchases/${event.uid}/edit/\${inputField.id}/\${inputValue}\`, {
                            method: 'POST',
                        })
                        .then(response => {
                            if (response.status === 200) {
                                if(field === 'uid'){
                                    window.location.href = \`/purchases/\${inputValue}\`
                                }else{
                                    window.location.reload();
                                }
                                alert('Data updated successfully.');
                            } else {
                                alert('Error updating data.');
                            }
                        });
                    } else {
                        alert('Please enter a value to update the data.');
                    }
                }
            </script>
        </head>
        <body>
            <h1>${event.full_name}'s Information</h1>
            <div class="container">
                <div>
                    <strong>UID:</strong> <a>${event.uid}</a>
                    <div class="change-info">
                        <input id="uid" type="text" placeholder="Change UID" />
                        <button onclick="handleButtonClick('uid')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Card Details:</strong> <a>${event.card_details}</a>
                    <div class="change-info">
                        <input id="card_details" type="text" placeholder="Change Card Numbers" />
                        <button onclick="handleButtonClick('amount')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Card Expiery:</strong> <a>${event.card_expiery}</a>
                    <div class="change-info">
                        <input id="card_expiery" type="text" placeholder="Change Expiery" />
                        <button onclick="handleButtonClick('currency')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Card CVV:</strong> <a>${event.card_cvv}</a>
                    <div class="change-info">
                        <input id="card_cvv" type="text" placeholder="Change CVV" />
                        <button onclick="handleButtonClick('game')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Card Holders Name:</strong> <a>${event.full_name}</a>
                    <div class="change-info">
                        <input id="full_name" type="text" placeholder="Change Is Name" />
                        <button onclick="handleButtonClick('isPaid')">Change</button>
                    </div>
                </div>
                <div>
                    <strong>Address:</strong> <a>${event.address}</a>
                    <div class="change-info">
                        <input id="address" type="input" placeholder="Change Address" />
                        <button onclick="handleButtonClick('date')">Change</button>
                    </div>
                </div>
            </div>
            <a stytle="background-color: #fff;color: #000;padding: 1rem;box-shadow: 0 0 10px #0ff;border: 2px solid #0ff;" href="/cards">Back to Cards</a>
        </body>
        </html>
    `;
    res.send(html);
});

app.post('/purchases/:uid/edit/:field/:value', (req, res) => {
    const uid = req.params.uid;
    const field = req.params.field;
    const newValue = req.params.value;

    // Read and parse the data from the JSON file
    const data = JSON.parse(fs.readFileSync('./payment_events.json'));

    // Find the event with the given UID
    const event = data.find(event => event.uid === uid);

    if (!event) {
        return res.status(404).send('Event not found.');
    }

    // Update the specified field with the new value
    event[field] = newValue;

    // Write the updated data back to the JSON file
    fs.writeFileSync('./payment_events.json', JSON.stringify(data, null, 2));

    res.status(200).send('Data updated successfully.');
});


app.get('/purchases/:uid/:data', (req, res) => {
    const events = JSON.parse(fs.readFileSync('./payment_events.json'));
    const event = events.find(event => event.uid === req.params.uid);
    if (!event) return res.send('The event with the given UID was not found.');
    res.send(event[req.params.data]);
});

app.get('/SL', (req, res) => {
    // sned SL.png
    res.sendFile(__dirname + '/img/SL.ico');

});

app.get('/accounts/fortnite', (req, res) => {
    // aleart_on_payment("Fortnite Account Purchased");
    res.sendFile(__dirname + '/fortnite.html');
});

app.get('/api/stripe/live', (req, res) => {
    
});
const salt = "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";
const stripe = require('stripe')(salt);
const endpointSecret = "whsec_667985841c2921787cee475c674f357ee59a3161100cb72a8681a82c4f9edf56";

app.post('/api/stripe', express.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];
  
    let event;
  
    console.log("HELLO")
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    aleart_on_payment("Fortnite Account Purchased");
    // open payment events json file and add the event to the json file
    const json = fs.readFileSync('./payment_events.json');
    const events = JSON.parse(json);
    events.push(event);
    fs.writeFileSync('./payment_events.json', JSON.stringify(events, null, 2));
    response.send();
  });

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
