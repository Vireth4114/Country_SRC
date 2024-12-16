const COUNTRIES = document.getElementById("countries");
const SEARCH_GAME = document.getElementById("searchGame");
const SEARCH_DIV = document.getElementById("searchDiv");
const CATEGORIES = document.getElementById("categories");
const FETCH_BUTTON = document.getElementById("fetchSRC");
const RESPONSE_DIV = document.getElementById("response");
let theGame;

const countryNames = new Intl.DisplayNames(['en'], {type: 'region'});
for (let i = 65; i <= 90; i++) {
    for (let j = 65; j <= 90; j++) {
        let code = String.fromCharCode(i) + String.fromCharCode(j)
        let name = countryNames.of(code)
        if (code !== name && code !== 'FX' && code !== 'ZZ') {
            COUNTRIES.innerHTML += `<option value="${code.toLowerCase()}">${name}</option>`;
        }
    }
}
COUNTRIES.innerHTML += `<option value="ca/qc">Québec</option>`;

SEARCH_GAME.addEventListener("input", function() {
    let searchReq = `https://www.speedrun.com/api/v1/games?name=${SEARCH_GAME.value}&max=10`;
    fetch(searchReq)
        .then(response => {
            if (!response.ok) {
                throw response.status;
            }
            return response.json();
        })
        .then(response => {
            SEARCH_DIV.innerHTML = "";
            SEARCH_DIV.style.border = "";
            response["data"].forEach(game => {
                SEARCH_DIV.style.border = "solid white 1px";
                SEARCH_DIV.innerHTML += `<option class="game" value="${game["id"]}">${game["names"]["international"]}</option>`
            });
            [].forEach.call(document.getElementsByClassName("game"), function(game) {
                game.addEventListener("click", function() {
                    SEARCH_DIV.innerHTML = "";
                    SEARCH_DIV.style.border = "";
                    SEARCH_GAME.value = game.textContent;
                    theGame = game.value;
                    let categoriesReq = `https://www.speedrun.com/api/v1/games/${game.value}/categories`;
                    fetch(categoriesReq)
                        .then(response => {
                            if (!response.ok) {
                                throw response.status;
                            }
                            return response.json();
                        })
                        .then(response => {
                            CATEGORIES.innerHTML = "";
                            response["data"].forEach(cat => {
                                if (cat["type"] == "per-game") {
                                    CATEGORIES.innerHTML += `<option value="${cat["id"]}">${cat["name"]}</option>`;
                                }
                            });
                            FETCH_BUTTON.disabled = false;
                        })
                        .catch(status => {
                            CATEGORIES.innerHTML = (status == 420) ? "calm down pls 🥹" : "src probably dead ngl";
                        });
                });
            });
        })
        .catch(status => {
            SEARCH_DIV.style.border = "solid white 1px";
            SEARCH_DIV.innerHTML = (status == 420) ? "calm down pls 🥹" : "src probably dead ngl";
        });
});

function displayThings(json) {
    let allRunners = {};
    let country = COUNTRIES.value;
    json["data"]["players"]["data"].forEach(runner => {
        if (runner["rel"] != "guest") {
            if (runner["location"] != null) {
                allRunners[runner["id"]] = [runner["names"]["international"], runner["location"]["country"]["code"]];
            } else {
                allRunners[runner["id"]] = [runner["names"]["international"], null];
            }
        }
    });

    let ranking = 0
    let shift = 0
    let previousPlace = 0;
    let hasRunners = false;
    json["data"]["runs"].forEach(runs => {
        if (runs["run"]["players"][0]["rel"] != "guest") {
            let playerID = runs["run"]["players"][0]["id"];
            if (allRunners[playerID][1] == country) {
                hasRunners = true;
                let place = runs["place"];
                let name = allRunners[playerID][0];
                let time = new Date(1000 * runs["run"]["times"]["primary_t"]).toISOString().substring(11, 23);
                
                if (previousPlace != place) {
                    ranking += shift + 1;
                    shift = 0;
                } else {
                    shift++;
                }
                RESPONSE_DIV.innerHTML += `<tr><td>${ranking}</td><td>${name}</td><td>${time}</td><td>${place}</td></tr>`
                previousPlace = place;
            }
        }
    });
    if (!hasRunners) {
        RESPONSE_DIV.innerHTML += "<tr><td colspan='4'>NONE :(</td></tr>";
    }
}

function doThings() {
    RESPONSE_DIV.innerHTML = "<tr>\
                                  <th>Rankings</th>\
                                  <th>Player</th>\
                                  <th>Time</th>\
                                  <th>Global Rankings</th>\
                              </tr>\
                              <tr><td colspan=\"4\">Loading...</td></tr>";
    let cat = CATEGORIES.value;
    let req = `https://www.speedrun.com/api/v1/leaderboards/${theGame}/category/${cat}?&embed=players.user`;
    fetch(req)
        .then(response => {
            if (!response.ok) {
                throw response.status;
            }
            return response.json();
        })
        .then(response => {
            RESPONSE_DIV.innerHTML = RESPONSE_DIV.innerHTML.replace("<tr><td colspan=\"4\">Loading...</td></tr>", "");
            displayThings(response);
        })
        .catch(status => {
            RESPONSE_DIV.innerHTML = RESPONSE_DIV.innerHTML.replace("<tr><td colspan=\"4\">Loading...</td></tr>", "");
            if (typeof(status) != "number") {
                doThings();
            } else {
                if (status == 420) {
                    RESPONSE_DIV.innerHTML += "<tr><td colspan='4'>calm down pls 🥹</td></tr>";
                } else {
                    RESPONSE_DIV.innerHTML += "<tr><td colspan='4'>Either src bad or dev bad</td></tr>";
                }
            }
        });
};