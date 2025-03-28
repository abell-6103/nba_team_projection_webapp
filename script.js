// HTML Elements
const display = document.getElementById('display');
const rtg_display = document.getElementById('rtg_display');
const player_input = document.getElementById('player_input');
const error_notif_div = document.getElementById('error_notif')
const desc_div = document.getElementById('desc');
const roster_size_display = document.getElementById('roster-size');
const add_player_btn = document.getElementById('add_player_btn');
const clear_list_btn = document.getElementById('clear_list_btn');
const player_list = document.getElementById('player_list');
let info_btn = document.getElementById('info-btn');

function is_letter(char) {
    // Checks if a string is a alphabetical character
    if (char.length > 1) {
        return false;
    } else if (char.toLowerCase() == char.toUpperCase()) {
        return false;
    }
    return true;
};

function format_name(name_str) {
    // Converts a given string to all lowercase and removes all non letter characters
    const lowercase_str = name_str.toLowerCase();
    let new_str = "";
    for (let i = 0; i < lowercase_str.length; i++) {
        const char = lowercase_str[i];
        if (is_letter(char)) {
            new_str += char;
        }
    };
    return new_str;
};

function fetch_player_data() {
    return fetch('data/player_data.json').then(res => {
        return res.json().then(data => {
            return data;
        }).catch(error => {
            console.error(error);
        });
    });
};

let player_data;
fetch_player_data().then(data => {
    player_data = data;
});

function find_player(player_name) {
    // Searches through the player_data array for a player that matches a given name
    for (let i = 0; i < player_data.length; i++) {
        const current_player = player_data[i];
        if (format_name(current_player.name) == format_name(player_name)) {
            return current_player;
        };
    };
    return null;
};

function calc_possessions(fga,orb,tov,fta) {
    // Basic formula to estimate possessions
    return (fga - orb) + tov + 0.44 * fta;
};

function calc_win_pct(ortg, drtg) {
    // A simple pythagorean-like formula to predict win percentage
    // Formula originally from Dean Oliver/Bill James
    const z = 16.1615; // This value can be tweaked, I just found 16.1615 to be generally accurate
    return (ortg ** z) / (ortg ** z + drtg ** z);
};

class Player {
    // Class that contains various attributes associated with an nba player
    constructor(name,ortg,drtg,mpg,gp,pos,pace,reb_pct,tov,ft,fga,efg) {
        this.name = name; // Player Name
        this.ortg = ortg; // Offensive Rating
        this.drtg = drtg; // Defensive Rating
        this.gp = gp; // Games Played
        this.mpg = mpg; // Minutes per game
        this.pos = pos; // Total possessions
        this.ppg = pos / gp; // Possessions per game
        this.pace = pace; // Possessions per 48 minutes
        this.reb_pct = reb_pct; // Rebound percentage
        this.tov_pct = tov / pos; // Turnover percentage
        this.ft_rate = ft / fga; // Free throws made per field goal attempt
        this.efg_pct = efg / fga; // Effective Field Goal percentage
    };

    log_player() {
        console.log(`${this.name} (ORTG: ${this.ortg}, DRTG: ${this.drtg}, PPG: ${this.ppg}, MPG: ${this.mpg})`);
    };
};

class Team {
    // Class that represents an nba team; contains a list of players and uses their stats to predict team performance
    constructor(name) {
        this.name = name;
        this.players = [];
    };

    sort_players() {
        // Sorts the list of players by player name
        this.players.sort((a,b) => a.name.localeCompare(b.name));
    }

    log_team() {
        const win_info = this.get_record();
        console.log(`${this.name} (${this.players.length} members): ${win_info['w']}-${win_info['l']}`);
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            listed_player.log_player();
        };
    };

    add_player(player) {
        // Add a player object to the team

        // Check that a player with this name does not already exist
        for (let i = 0; i < this.players.length; i++) {
            const team_player = this.players[i];
            if (player.name == team_player.name) {
                return false;
            };
        };
        // If no matching player is found, add the new player
        this.players.push(player);
        console.log(`Added ${player.name} to ${this.name}.`);
        this.sort_players();
        return true;
    };

    remove_player(player_name) {
        // Find and remove a player object with the matching name
        for (let i = 0; i < this.players.length; i++) {
            const team_player = this.players[i];
            if (player_name == team_player.name) {
                this.players.splice(i,1);
                console.log(`Removed ${player_name} from ${this.name}.`);
                return true;
            };
        };
        return false;
    };

    clear_team() {
        // Removes all players from the team
        this.players.length = 0;
        console.log(`Cleared ${this.name}.`);
    }

    get_pace() {
        // Estimates the pace of the team by averaging the pace of each member and weighing for ppg
        let pace_sum = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            pace_sum += listed_player.pace * listed_player.ppg;
            sum_of_ppg += listed_player.ppg;
        };
        const pace = pace_sum / sum_of_ppg;
        return pace;
    };

    get_efg_pct() {
        // Estimates the efg% of the team by averaging the efg% of each member and weighing for ppg
        let efg_pct_sum = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            efg_pct_sum += listed_player.efg_pct * listed_player.ppg;
            sum_of_ppg += listed_player.ppg;
        };
        const efg_pct = efg_pct_sum / sum_of_ppg;
        return efg_pct;
    };

    get_tov_pct() {
        // Estimates the tov% of the team by averaging the tov% of each member and weighing for ppg
        let tov_pct_sum = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            tov_pct_sum += listed_player.tov_pct * listed_player.ppg
            sum_of_ppg += listed_player.ppg
        };
        const tov_pct = tov_pct_sum / sum_of_ppg;
        return tov_pct;
    };

    get_reb_pct() {
        // Estimates the reb% of the team by averaging the reb% of each member and weighing for ppg
        let reb_pct_sum = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            reb_pct_sum += listed_player.reb_pct * listed_player.ppg
            sum_of_ppg += listed_player.ppg
        };
        const reb_pct = reb_pct_sum / sum_of_ppg;
        return reb_pct;
    };

    get_ft_rate() {
        // Estimates the team's FT/FGA value by averaging the respective value of each member and weighing for ppg
        let ft_rate_sum = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            ft_rate_sum += listed_player.ft_rate * listed_player.ppg;
            sum_of_ppg += listed_player.ppg;
        };
        const ft_rate = ft_rate_sum / sum_of_ppg;
        return ft_rate;
    }

    get_ortg() {
        // Estimates the team's offensive rating by averaging the respective value of each member and weighing for ppg
        let total_rtg = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            total_rtg += listed_player.ortg * listed_player.ppg;
            sum_of_ppg += listed_player.ppg;
        };
        const ortg = total_rtg / sum_of_ppg;
        return ortg;
    };

    get_drtg() {
        // Estimates the team's defensive rating by averaging the respective value of each member and weighing for ppg
        let total_rtg = 0;
        let sum_of_ppg = 0;
        for (let i = 0; i < this.players.length; i++) {
            const listed_player = this.players[i];
            total_rtg += listed_player.drtg * listed_player.ppg;
            sum_of_ppg += listed_player.ppg;
        };
        const drtg = total_rtg / sum_of_ppg;
        return drtg;
    };

    get_net_rtg() {
        // Estimates the team's net rating by subtracting its defensive rating from its offensive rating
        const ortg = this.get_ortg();
        const drtg = this.get_drtg();
        return ortg - drtg;
    };

    get_record() {
        // Uses the team's offensive and defensive ratings to estimate performance over an 82 game season

        if (this.players.length < 5) {
            const info = {
                'w' : 0,
                'l' : 82,
                'win_pct' : 0
            };
            return info;
        };

        const ortg = this.get_ortg();
        const drtg = this.get_drtg();

        const raw_win_pct = calc_win_pct(ortg,drtg);
        const raw_wins = 82 * raw_win_pct;

        const wins = Math.floor(raw_wins);
        const losses = 82 - wins;
        const win_pct = wins/82;

        const info = {
            'w': wins,
            'l' : losses,
            'win_pct' : win_pct
        };
        return info
    };
};

let player_list_elements = []; // Used to store html elements representing players on a team
let custom_team = new Team('Custom Team'); // Team object that the user interacts with
let more_info = false; // Boolean indicating whether or not the description is expanded

// Short description, always visible
const desc_str = `This site predicts how a hypothetical NBA team would perform during the regular season. Input a roster of between five to fifteen players to see how they would hypothetically perform if they were on one team.
<br>This site is configured to only use data from a single chosen season. If a player did not appear during that season, they will not be available to select from on this site.
<br>Player names are spelling sensitive. Make sure to input a player's name exactly as it is listed by the NBA (Luka Dončić is correct while Luka Doncic is incorrect).
<br>`;

const more_info_btn_html = `<button id="info-btn">▼ More Info ▼</button>`; // Used when displaying the short description
const hide_info_btn_html = `<button id="info-btn">▲ Hide Info ▲</button>`; // Used when displaying the long description

// Long description, toggleable
const extra_info_str = `<br>Over the course of an NBA season, a player's performance can be gauged via stats such as offensive rating, defensive rating, and possessions per game. 
Using these stats, a roster of players from across the NBA can be constructed and have their hypothetical performance on the same team predicted.
<br>
<br>Possession: An uninterrupted stretch where a team is in control of the ball
<br>Offensive Rating: Points generated per 100 possessions of play
<br>Defensive Rating: Points given up to the other team per 100 possessions of play
<br>Net Rating: Offensive rating minus defensive rating
<br>Pace: Possessions per 48 minutes of play
<br>eFG% (Effective Field Goal Percent): Field goal percentage that adjusts for three pointers being more valuable
<br>TOV% (Turnover Percent): The percentage of possessions that end in a turnover
<br>REB% (Rebound Percent): The percentage of available rebounds that were successfully rebounded
<br>FT/FGA: The number of made free throws per field goal attempt
<br>`;

function on_info_btn_click() {
    // Respond to clicks on the more/less info button

    more_info = !more_info;
    if (more_info) {
        desc_div.innerHTML = desc_str + extra_info_str + hide_info_btn_html; // Long description
        console.log('Displaying info');
    } else {
        desc_div.innerHTML = desc_str + more_info_btn_html; // Short description
        console.log('Hiding info')
    };
    info_btn = document.getElementById('info-btn');
    info_btn.onclick = on_info_btn_click; // Reattach the function to the new button
};

function round_number(num,digits) {
    // Rounds a number to a set number of decimal places; digits can be negative
    if (digits == null) {
        digits = 0;
    }
    return Math.round(num * (10 ** digits)) / (10 ** digits)
};

function set_error_notif(notif) {
    // Update the error indicator with a given message
    if (notif == null) {
        error_notif_div.innerHTML = ""
    } else {
        error_notif_div.innerHTML = notif;
    }
};

function update_display() {
    // Updates the team performance display to reflect the team's stats
    const record = custom_team.get_record()
    const roster_size = custom_team.players.length;
    display.innerHTML = `${record['w']}-${record['l']}`
    roster_size_display.innerHTML = `(${roster_size}/15)`
    if (custom_team.players.length < 5) {
        rtg_display.innerHTML = "Offensive Rating: N/A<br>Defensive Rating: N/A<br>Net Rating: N/A<br>Pace: N/A<br><br>eFG%: N/A<br>TOV%: N/A<br>REB%: N/A<br>FT/FGA: N/A";
        set_error_notif('Not enough players.');
    } else {
        const ortg = custom_team.get_ortg();
        const drtg = custom_team.get_drtg();
        const net_rtg = custom_team.get_net_rtg();
        const pace = custom_team.get_pace();
        const efg_pct = custom_team.get_efg_pct();
        const tov_pct = custom_team.get_tov_pct();
        const reb_pct = custom_team.get_reb_pct();
        const ft_rate = custom_team.get_ft_rate();
        rtg_display.innerHTML = `Offensive Rating: ${round_number(ortg,2)}<br>Defensive Rating: ${round_number(drtg,2)}<br>Net Rating : ${round_number(net_rtg,2)}<br>Pace: ${round_number(pace,2)}<br><br>eFG%: ${round_number(efg_pct,3)}<br>TOV%: ${round_number(tov_pct,3)}<br>REB%: ${round_number(reb_pct,3)}<br>FT/FGA: ${round_number(ft_rate,3)}`
        set_error_notif('');
    };
}

function create_player_element(player) {
    // Creates an html element to represent a given player
    const player_name = player.name;

    let new_entry = document.createElement('div');
    new_entry.className = 'player_entry';
    new_entry.innerHTML += player_name;

    // Creates a button that allows a player to be individually removed from the team
    let entry_btn = document.createElement('button');
    entry_btn.className = 'remove_player_btn';
    entry_btn.innerHTML += '&minus;';
    entry_btn.onclick = function() {
        custom_team.remove_player(player_name);
        new_entry.remove();
        update_display();
    };

    new_entry.appendChild(entry_btn);
    return new_entry;
};

function add_to_list(player) {
    // Adds a player to the html roster element
    let entry = create_player_element(player);

    player_list_elements.push(entry);
    player_list.appendChild(entry);
}

function generate_entries() {
    // Adds the team's whole roster to the html roster element
    for (let i = 0; i < custom_team.players.length; i++) {
        const listed_player = custom_team.players[i];
        add_to_list(listed_player);
    };
}

function clear_entries() {
    // Removes all entries from the html roster element
    for (let i = 0; i < player_list_elements.length; i++) {
        list_element = player_list_elements[i];
        list_element.remove()
    }
}

function set_entries() {
    // Configures the html roster element to reflect the team's current roster
    clear_entries();
    generate_entries();
};

function on_add_btn_click() {
    // Responds to user attempts to add a player to the team

    const team_size = custom_team.players.length;
    if (team_size >= 15) {
        set_error_notif('Team can only contain 15 players.');
        return false;
    };

    // Make sure the player name isn't blank
    const str_input = player_input.value;
    if (str_input.replaceAll(" ",'') == "") {
        set_error_notif('Please input a name.');
        return false;
    };

    // Check if the player actually exists
    const player_info = find_player(str_input);
    if (player_info == null) {
        set_error_notif('Player not found.');
        return false;
    };

    const player = new Player(player_info.name,player_info.ortg,player_info.drtg,player_info.mpg,player_info.gp,player_info.pos,player_info.pace,player_info.reb_pct,player_info.tov,player_info.ft,player_info.fga,player_info.efg);
    const player_added = custom_team.add_player(player);
    if (player_added) {
        player_input.value = ""; // Clear the player input element
        set_error_notif("");
        set_entries();
        update_display();
    } else {
        // If a add_player call fails, then that team already contains that player
        set_error_notif('Player already in team.')
        return false;
    }
    return true;
}

function on_clear_btn_click() {
    // Responds to user input to clear the team's roster
    custom_team.clear_team();
    update_display();
    clear_entries();
};

// Assign buttons to call certain functions
info_btn.onclick = on_info_btn_click;
add_player_btn.onclick = on_add_btn_click;
clear_list_btn.onclick = on_clear_btn_click;

// Allows the user to hit enter on a player name instead of pressing the add player button
player_input.addEventListener("keypress", function(event) {
    if (event.key == 'Enter') {
        add_player_btn.click();
    };
});