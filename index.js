const express = require('express');
const app = express();
const port = 9999; // You can use any port you prefer
const fs = require('fs');
const requests = require('requests');
const jwt = require('jsonwebtoken');
const { get } = require('http');
const { json } = require('body-parser');
const { Console } = require('console');

//https://www.zleague.gg/v2/wallet/cash-transactions

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(fs.readFileSync('index.html', 'utf-8'));
});

async function verrifyAuth(user_id) {
    authToken=""
    user=""
    if (fs.existsSync('auth.json')) {
        let auth = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        //find the user with the matching id
        for (let i = 0; i < auth.logins.length; i++) {
            if (auth.logins[i].id == user_id) {
                console.log('user found');
                user = auth.logins[i];
                authToken = auth.logins[i].authToken;
            }
        }

        const decoded = jwt.decode(authToken);
        try {
            if (decoded.exp < Date.now() / 1000) {
                const newToken = await getAuth(user.username, user.password);
                user.authToken = newToken;
                fs.writeFileSync('auth.json', JSON.stringify(auth, null, 2));
                console.log('token expired');
                return await newToken;
            }
        } catch (error) {
            console.log('token expired');
            return await getAuth(user.username, user.password);
        }
        return authToken;

    }
}

async function getAuth(username, password){

    const url = 'https://www.zleague.gg/v2/login';

    const data = `username=${username}&password=${password}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
    });
    authToken = JSON.parse(await response.text()).accessToken;
    //open auth.json find the object with a matching username and update the authToken
    let auth = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
    for (let i = 0; i < auth.length; i++) {
        if (auth[i].username == username) {
            auth[i].authToken = authToken;
        }
    }
    fs.writeFileSync('auth.json', JSON.stringify(auth, null, 2));
    console.log(authToken);
    return authToken;
}

async function makeApiRequests(authToken) {
    const url = 'https://www.zleague.gg/v2/account/upcoming-teams';

    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
        }
    });

    const res = JSON.parse(await response.text());
    try{
        if(res.teams.length ==0){
            // console.log('not in a tournament');
            return {"scoreboard":NAN, "teamScoreboardMetadata":NAN};
        }
    } catch (error) {
        // console.log('not in a tournament');
        return {"scoreboard":"", "teamScoreboardMetadata":""};
    }
    tournament_id = res.teams[0].event.id;
    
    return await showTournamentDetails(tournament_id,authToken);
}

async function showTournamentDetails(tournament_id, authToken) {
    const url = 'https://www.zleague.gg/v2/play-now/scoreboard/'+tournament_id;

    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
        },
    });

    const text = JSON.parse(await response.text());
    scoreboard = text.scoreboard;
    teamScoreboardMetadata = text.teamScoreboardMetadata;
    return {"scoreboard":scoreboard, "teamScoreboardMetadata":teamScoreboardMetadata};
}

app.get('/tournament/:id', async (req, res) => {
    id = req.params.id;
    auth = await verrifyAuth(id);
    const time = await fetchInfo('/account/upcoming-teams', auth);
    if(await time.teams.length > 0){
        const start_time = await time.teams[0].event.startTime;
        //make start time readable in minutes left end time is start time + 90 minutes
        const end_time = new Date(start_time);
        end_time.setMinutes(end_time.getMinutes() + 90);
        //subtratc the current time from the end time to get the minutes left
        const current_time = new Date();
        minutes_left = Math.floor((end_time - current_time) / 60000);
    }
    const data = await makeApiRequests(auth);
    const teams = await data.scoreboard;
    const teamScoreboardMetadata = data.teamScoreboardMetadata;
    
    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tournament Standings</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #444; /* Dark background color */
                    color: #fff; /* Text color */
                }

                .container {
                    max-width: 100%;
                    margin: 20px auto;
                    margin-top: 0;
                    padding: 20px;
                    background-color: #444; /* Darker container background */
                    border-radius: 5px;
                    // box-shadow: 0 0 10px rgba(255, 255, 255, 0.1); /* Subtle glow effect */
                }

                h1 {
                    text-align: center;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #666; /* Darker border color */
                }

                th {
                    background-color: #555; /* Darker header background color */
                }

                .center {
                    text-align: center;
                }
                .NA {
                    text-align: center;
                    padding-top: 25%;
                    font-family: Arial, sans-serif;
                    font-size: 50px;
                    text-shadow: 2px 2px 4px #000000;
                }
                h2 {
                    text-align: center;
                }
            </style>
            <script>
                window.onload = function() {
                    setInterval(function() {
                        location.reload();
                    }, 60000); // Refresh the page every 30 seconds
                }
            </script>
        </head>
        <body>
            <div class="container">
            `;
            
            if (teams && teams.length > 0) {
                html += `
                <h1>Tournament Standings, Current Placement ${teamScoreboardMetadata.place}</h1>
                <h2>Minutes Left: ${minutes_left}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Team Name</th>
                            <th>Points</th>
                            <th>Games Played</th>
                        </tr>
                    </thead>
                    <tbody id="standings">
        `;

        teams.sort((a, b) => b.points - a.points); // Sort teams by points
        teams.forEach(team => {
            if (team.teamName === 'YouKnowMe') {
                net_negative = "background-color: #DD2000;"
                net_neutral = "background-color: #FFD700;"
                net_positive = "background-color: #00FF00;"
                if(teamScoreboardMetadata.place >=6){
                    style = net_negative
                }
                if(teamScoreboardMetadata.place <=5){
                    style = net_neutral
                } 
                if(teamScoreboardMetadata.place <=2){
                    style = net_positive
                }

                html += `
                    <tr style="${style}"> <!-- Highlight the user's team -->
                    <td>${team.teamName}</td>
                    <td class="center" >${team.points}</td>
                    <td class="center">${team.gamesPlayed}</td>

                </tr>`
            } else {
                html += `
                    <tr>
                        <td>${team.teamName}</td>
                        <td class="center">${team.points}</td>
                        <td class="center">${team.gamesPlayed}</td>
                    </tr>
                `;
            }
        });

        html += `
                    </tbody>
                </table>
        `;
    } else {
        html += `
                <h2 class="NA">Not in a tournament</h2>
        `;
    }

    html += `
            </div>
        </body>
        </html>
    `;

    res.send(html);

});
async function fetchInfo(url, authToken) {
    base_url = 'https://www.zleague.gg/v2'+url;
    const response = await fetch(base_url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
        },
    });
    // res = JSON.parse(await response.text());
    res = await response.text();
    return JSON.parse(res);
}

async function PostInfo(url,data, authToken) {
    const base_url = 'https://www.zleague.gg/v2' + url;

    const body = `${data}`;

    const response = await fetch(base_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
        },
        body: body,
    });
    // res = JSON.parse(await response.text());
    res = await response.text();
    console.log(res);
    return JSON.parse(res);
}


app.get('/account/:id', async (req, res) => {
    id = req.params.id;

    const auth = await verrifyAuth(id);
    // PostInfo('/wallet/initiate-withdraw', auth);
    const account = await fetchInfo('/account', auth);
    // console.log(await fetchInfo('/profile?username=Edgelord69420'));

    // fetchInfo('/play-now/team/register')
    const winnings = await fetchInfo('/wallet/cash-transactions', auth);
    let total_winnings = 0; 
    for (let i = 0; i < winnings.length; i++) {
        if(winnings[i].reasonType == 'PAYMENT'){
            total_winnings += winnings[i].cashAmount;
        }
    }
    const credit_winnings = await fetchInfo('/account/credit-transactions', auth);
    let Tcredit_winnings = 0; 
    for (let i = 0; i < credit_winnings.length; i++) {
        if(credit_winnings[i].transactionType == 'ADDED'){
            // console.log(credit_winnings[i]);
            Tcredit_winnings += credit_winnings[i].amount;
        }
    }
    // Get account details from /account endpoint and /payments/balances endpoint
    
    const balances = await fetchInfo('/payments/balances', auth);
    // Extract necessary information from the response
    const credits = account.creditBalance;
    const username = account.userName;
    const cash = balances.totalBalance;
    const non_withdrawable = balances.nonwithdrawableBalance;
    const withdrawable = balances.withdrawableBalance;
    const verified = account.identityVerificationStatus;

    // Generate HTML with the account information
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Information</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #444; /* Dark background color */
                color: #fff; /* Text color */
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }

            .zleague-button {
                background-color: #2c3e50;
                color: #fff;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* subtle glow effect */
                margin-left: 10px;
                transition: background-color 0.3s;
            }
            .zleague-button:hover {
                background-color: #34495e;
            }
            .container {
                width: 100%;
                max-width: 100%;
                padding: 20px;
                background-color: #444; /* Darker container background */
                border-radius: 20px;

            }

            h1 {
                text-align: center;
                font-size: 28px;
            }

            .account-info {
                margin-bottom: 20px;
            }

            .account-info p {
                margin: 10px 0;
                padding: 10px;
                background-color: #555; /* Darker rectangle background */
                border-radius: 10px;
                font-size: 20px;
            }

            .account-info p strong {
                font-size: 22px;
            }

            .modal {
                display: none; /* Hidden by default */
                position: fixed; /* Fixed position */
                z-index: 1; /* Make sure it appears on top */
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto; /* Enable scrolling if needed */
                background-color: rgba(0, 0, 0, 0.5); /* Black with opacity */
            }
    
            .modal-content {
                background-color: #333;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                width: 50%;
                border-radius: 10px;
            }
    
            .close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
            }
    
            .close:hover,
            .close:focus {
                color: #fff;
                text-decoration: none;
                cursor: pointer;
            }
    
            /* Form Styles */
            form {
                display: flex;
                flex-direction: column;
            }
    
            label {
                margin-bottom: 10px;
            }
    
            input[type="text"] {
                padding: 8px;
                margin-bottom: 10px;
                border-radius: 5px;
                border: 1px solid #aaa;
            }
    
            button[type="submit"] {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                background-color: #2c3e50;
                color: #fff;
                cursor: pointer;
            }
    
            button[type="submit"]:hover {
                background-color: #34495e;
            }

        </style>
    </head>
    <body>
        <div class="container">
            <h1>Account Information</h1>
            <div class="account-info">
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Total Cash Withdrawn:</strong> ${total_winnings}</p>
                <p><strong>Total Credits Won:</strong> ${Tcredit_winnings}</p>
                <p><strong>Credits:</strong> ${credits}</p>
                <p><strong>Cash:</strong> ${cash}</p>
                <p><strong>Non-withdrawable Balance:</strong> ${non_withdrawable}</p>
                <p><strong>Withdrawable Balance:</strong> ${withdrawable}  <button class="zleague-button" onclick="openWithdrawModal()">Withdraw Funds</button></p>
                <p><strong>Verified:</strong> ${verified ? 'Yes' : 'No'}</p>
            </div>
        </div>
    
        <!-- Withdraw Modal -->
        <div id="withdrawModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeWithdrawModal()">&times;</span>
                <h2>Withdraw Funds</h2>
                <form id="withdrawForm">
                    <label for="amount">Amount:<a style="float:right;color:rgb(31, 226, 37);"> Available: ${withdrawable}</a></label> 
                    <input type="text" id="amount" name="amount" required>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>

        <script>
            // Get the modal
            var modal = document.getElementById('withdrawModal');

            // When the user clicks on the button, open the modal
            function openWithdrawModal() {
                modal.style.display = 'block';
            }

            // When the user clicks on <span> (x), close the modal
            function closeWithdrawModal() {
                modal.style.display = 'none';
            }

            // When the user clicks anywhere outside of the modal, close it
            window.onclick = function(event) {
                if (event.target == modal) {
                    closeWithdrawModal();
                }
            }

            // Submit form function can be added to send the withdrawal request to the server
            document.getElementById('withdrawForm').addEventListener('submit', async function(event) {
                event.preventDefault();
                var amount = document.getElementById('amount').value;
                const maxWithdraw = ${withdrawable};
                if (amount > maxWithdraw) {
                    alert('Insufficient funds');
                    return;
                }

                //post to the server /withdraw
                const response = await fetch('/withdraw?amount='+ amount)

                if (await response.ok) {
                    alert('Withdrawal request submitted');
                    closeWithdrawModal();
                    window.location.reload();
                } else {
                    alert('Error submitting withdrawal request');
                }
            });
            window.onload = function() {
                closeWithdrawModal()
            }
        </script>
        </body>
        </html>
    `;

    res.send(html);
});

app.get('/login', async (req, res) => {
    console.log('logging in')
    const username = req.query.email;
    const password = req.query.password;
    const auth = await getAuth(username, password);
    const account = await fetchInfo('/account', auth);
    const login_id = await account.id;

    const data = {
        "login": "true",
        "username": username,
        "password": password,
        "id": login_id,
        "authToken": auth
    }
    //write to auth.json file with data and make it look pretty
    //append the new data to the file
    //check if the user is already in the file
    opend_file = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
    for (let i = 0; i < opend_file.logins.length; i++) {
        if (opend_file.logins[i].id === login_id) {
            await verrifyAuth(login_id);
            res.send({ "login": "true", "username": username, "id": login_id});
            return;
        }
    }
    opend_file.logins.push(data);
    fs.writeFileSync('auth.json', JSON.stringify(opend_file, null, 2));
    res.send({ "login": "true", "username": username, "id": `${login_id}`});
});

app.get('/withdraw', async (req, res) => {
    const amount = req.query.amount;
    const id = req.headers.cookie.split(':')[2];
    const body = `{"amount":${amount}}`;
    console.log(amount, id);
    const auth = await verrifyAuth(id);
    const response = await PostInfo('/wallet/initiate-withdraw',body, auth);
    response.amount = amount;
    const withdraw = await PostInfo('/wallet/withdraw',JSON.stringify(response), auth);
    res.send(withdraw);
});

app.get('*', (req, res) => {
    console.log(req.url);
    res.send('Route not found');
})
app.post('*', (req, res) => {
    console.log(req.url);
    res.status(404).send('Route not found');
})
app.listen(port, () => {
    console.log(`Server is listening on port ${port} \n-> http://service.strmlight.com`);
});
