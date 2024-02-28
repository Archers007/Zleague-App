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

verrifyAuth();

app.get('/', (req, res) => {
    res.send(fs.readFileSync('index.html', 'utf-8'));
});

//open auth.json file and get the authToken use jwt to check expiry if expired get new token
async function verrifyAuth() {
    
    

    if (fs.existsSync('auth.json')) {
        let auth = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
        authToken = auth.authToken;
        const decoded = jwt.decode(authToken);
        try {
            if (decoded.exp < Date.now() / 1000) {
                getAuth();
                console.log('token expired');
            }
        } catch (error) {
            getAuth();
            console.log('token expired');
        }

    }
}

verrifyAuth();
let tournament_id=''
let scoreboard = '' 
let teamScoreboardMetadata = ''
async function getAuth(){

    const url = 'https://www.zleague.gg/v2/login';

    const data = "username=Kieran%40bendell.ca&password=Sova-never1";

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
    });
    authToken = JSON.parse(await response.text()).accessToken;
    //write to auth.json file
    fs.writeFileSync('auth.json', JSON.stringify({authToken: authToken}));
    console.log(authToken);
}

async function test_register(game, amount){
    verrifyAuth();
    const url = 'https://www.zleague.gg/v2/play-now/team/register';
    // let data_body = 

    let apex_body=`{
        "details": {
          "entryFee": ${amount},
          "entryFeeType": "CASH",
          "game": "APEX_LEGENDS",
          "prizeType": "USD",
          "teamName": "YouKnowMe",
          "scoringFormat": "APEX_STANDARD"
        },
        "playerMetadata": {
          "clientType": "MOBILE",
          "game": "APEX_LEGENDS"
        }
      }`
    let chess_body=`{
        "details": {
          "entryFee": ${amount},
          "entryFeeType": "CREDIT",
          "game": "CHESS_DOT_COM",
          "prizeType": "CREDIT",
          "teamName": "YouKnowMe",
          "scoringFormat": "CHESS_BULLET_SEVEN"
        },
        "playerMetadata": {
          "clientType": "MOBILE",
          "game": "CHESS_DOT_COM"
        }
      }`
    let body = game == 'apex' ? apex_body : chess_body;
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: body,
    });
    res = JSON.parse(await response.text());
    console.log(res);
    let team_id = res.teamId;
    let Tournament_id = res.tournamentId;
    await test_pay_team(team_id,10,0);
    skip = game == 'apex' ? await test_legend_select(team_id, Tournament_id,) : "";
    await test_start_tournament(team_id, Tournament_id);
}

async function test_pay_team(team_id, amount=0, creditAmount=0){
    verrifyAuth();
    const url = 'https://www.zleague.gg/v2/wallet/wallet-transaction';
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: `{"teamId":"${team_id}","cashAmount":${amount},"creditAmount":${creditAmount}}`,
    });
    res = await response.text();
    console.log(JSON.parse(res));
    
}

async function test_legend_select(team_id, tournament_id){
    verrifyAuth();
    const url = 'https://www.zleague.gg/v2/tournament/player/change-legend';
    var player_id = await fetchInfo('/account/upcoming-teams')
    console.log(`{"teamId":"${team_id}","tournamentId":"${tournament_id}","newLegend":"Pathfinder","playerId":"${player_id.teams[0].teammates[0].id}"}`)
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: `{"teamId":"${team_id}","tournamentId":"${tournament_id}","newLegend":"Loba","playerId":"${player_id.teams[0].teammates[0].id}"}`,
    });
    res = await response.text();
    console.log(JSON.parse(res));
}

async function test_start_tournament(team_id, tournament_id){
    verrifyAuth();
    const url = 'https://www.zleague.gg/v2/play-now/competitors-search';
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: `{"tournamentId":"${tournament_id}","teamId":"${team_id}"}`,
    });
    res = await response.text();
    console.log(res)
}

// test_register("apex", 1);

app.get('/register/:game/:amount', async (req, res) => {
    game = req.params.game;
    amount = req.params.amount;
    test_register(game, amount);
    res.send('registered');
});

async function minigame_start(){
    verrifyAuth();
    // post request to /arcade/game/start
    const url = 'https://www.zleague.gg/v2/arcade/game/start';
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: `{"game":"BRICK_BREAK","entryFeeAmount":20,"entryFeeType":"CREDIT","prizeType":"CREDIT"}`,
    });
    res = JSON.parse(await response.text());
    //get epoch time
    let start_time = Date.now();
    console.log(res,start_time);
    minigame_end(res,start_time)

}

//4ab9a6a7-463e-41e1-91b9-50b6f038c9a4
//d7d12e2b-b348-4b89-bf12-b169e551f8d1

async function minigame_end(sesh_id,start_time){
    verrifyAuth();
    // post request to /arcade/game/end
    const url = 'https://www.zleague.gg/v2/arcade/game/submit-result'
    body = `{"id":"${sesh_id}","game":"BRICK_BREAK","score":100,"entryFeeAmount":20,"entryFeeType":"CREDIT","startTimestamp":${start_time},"endTimestamp":${Date.now()},"prizeAmount":20,"prizeType":"CREDIT","awardChestAsync":false,"hash":""}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: body,
    });
    res = JSON.parse(await response.text());
    console.log(res);
}
// minigame_start();




async function makeApiRequests() {
    verrifyAuth();
    const url = 'https://www.zleague.gg/v2/account/upcoming-teams';

    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
        }
    });

    const res = JSON.parse(await response.text());
    try{
        if(res.teams.length ==0){
            console.log('not in a tournament');
            return
        }
    } catch (error) {
        console.log('not in a tournament');
        return
    }
    tournament_id = res.teams[0].event.id;
    console.log(res.teams[0]);
    await showTournamentDetails();
    return
}

async function showTournamentDetails() {
    verrifyAuth();
    const url = 'https://www.zleague.gg/v2/play-now/scoreboard/'+tournament_id;

    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
        },
    });

    const text = JSON.parse(await response.text());
    scoreboard = text.scoreboard;
    teamScoreboardMetadata = text.teamScoreboardMetadata;
    console.log(teamScoreboardMetadata)
}
app.get('/tournament', async (req, res) => {
    verrifyAuth();
    await makeApiRequests();
    const teams = scoreboard;
    
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
            </style>
        </head>
        <body>
            <div class="container">
            `;
            
            if (teams && teams.length > 0) {
                html += `
                <h1>Tournament Standings, Current Placement ${teamScoreboardMetadata.place}</h1>
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
async function fetchInfo(url) {
    base_url = 'https://www.zleague.gg/v2'+url;
    const response = await fetch(base_url, {
        headers: {
            'Authorization': 'Bearer ' + authToken,
        },
    });
    // res = JSON.parse(await response.text());
    res = await response.text();
    console.log(res);
    return JSON.parse(res);
}


app.get('/account', async (req, res) => {
    verrifyAuth();
    // console.log(await fetchInfo('/profile?username=Edgelord69420'));

    // fetchInfo('/play-now/team/register')

    // Get account details from /account endpoint and /payments/balances endpoint
    const account = await fetchInfo('/account');
    console.log(account);
    const balances = await fetchInfo('/payments/balances');
    // Extract necessary information from the response
    const credits = account.creditBalance;
    const username = account.userName;
    const cash = balances.totalBalance;
    const non_withdrawable = balances.nonwithdrawableBalance;
    const withdrawable = balances.withdrawableBalance;
    const verified = account.identityVerificationStatus;
    const id = account.id;

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
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Account Information</h1>
            <div class="account-info">
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Credits:</strong> ${credits}</p>
                <p><strong>Cash:</strong> ${cash}</p>
                <p><strong>Non-withdrawable Balance:</strong> ${non_withdrawable}</p>
                <p><strong>Withdrawable Balance:</strong> ${withdrawable} <a class="zleague-button" href="https://www.zleague.gg/apex/my-profile?tab=transactions&game=apex" target=blank>Withdraw Funds</a></p>
                <p><strong>Verified:</strong> ${verified ? 'Yes' : 'No'}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    res.send(html);
});


/*
res.userName
res.creditBalance
res.cashBalance
*/ 

app.listen(port, () => {
    console.log(`Server is listening on port ${port} \n-> http://service.strmlight.com`);
});
