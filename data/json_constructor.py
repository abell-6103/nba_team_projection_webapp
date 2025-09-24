import pandas as pd

# Uses the nba_api library to get player stats https://github.com/swar/nba_api
from nba_api.stats.endpoints import playerestimatedmetrics, leaguedashplayerstats, leaguedashteamstats

NBA_SEASON = "2024-25" # This can be changed to any season from 1996-97 and onward

estimated_metrics = playerestimatedmetrics.PlayerEstimatedMetrics(league_id="00",season=NBA_SEASON).get_data_frames()[0].sort_values(by=['PLAYER_ID']).reset_index()
player_stats = leaguedashplayerstats.LeagueDashPlayerStats(season=NBA_SEASON).get_data_frames()[0].sort_values(by=['PLAYER_ID']).reset_index()

def calc_possessions(fga,orb,tov,fta):
    # Simple formula to estimate a number of possessions
    return (fga - orb) + tov + 0.44 * fta

def get_pos_col():
    # Generates a series containing player possessions
    fga_col = player_stats['FGA']
    orb_col = player_stats['OREB']
    tov_col = player_stats['TOV']
    fta_col = player_stats['FTA']

    pos_col = calc_possessions(fga_col,orb_col,tov_col,fta_col)
    return pos_col

def get_efg_col():
    # Generates a series containg player eFG%
    fg_col = player_stats['FGM']
    fg3_col = player_stats['FG3M']

    return fg_col + 0.5 * fg3_col

def main():
    player_name_col = estimated_metrics['PLAYER_NAME']

    ortg_col = estimated_metrics['E_OFF_RATING']
    drtg_col = estimated_metrics['E_DEF_RATING']

    mpg_col = estimated_metrics['MIN']
    gp_col = estimated_metrics['GP']

    pos_col = get_pos_col()
    pace_col = estimated_metrics['E_PACE']

    reb_col = estimated_metrics['E_REB_PCT']
    tov_col = player_stats['TOV']

    ft_col = player_stats['FTM']
    fga_col = player_stats['FGA']
    efg_col = get_efg_col()

    data_dict = {
        'name' : player_name_col,
        'ortg' : ortg_col,
        'drtg' : drtg_col,
        'mpg' : mpg_col,
        'gp' : gp_col,
        'pos' : pos_col,
        'pace' : pace_col,
        'reb_pct' : reb_col,
        'tov' : tov_col,
        'ft' : ft_col,
        'fga' : fga_col,
        'efg' : efg_col
    }

    df = pd.DataFrame(data_dict)

    json_text = df.to_json(orient='records',indent=4)
    with open('data/player_data.json','w') as json_file:
        json_file.write(json_text)

if __name__ == "__main__":
    main()
    print('Wrote json to file')