# NBA Team Projector
## Description
This webapp allows users to construct any hypothetical NBA roster and project how they would perform over the course of an 82 game season. While not a foolproof projection, it does provide insight into what expectations a user should hold of a hypothetical team.

The webapp uses a player's offensive rating, defensive rating, and possessions per game as the main predictors of how that player impacts a team. It also uses some other stats to project extra information on how that team would look on the court.

Player stats used in predictions are those from the 2023-24 regular NBA season. Players who have played in other seasons will only see their performance from the 2023-24 season reflected in their stats. In addition, players who saw zero minutes, including retired players, during the 2023-24 season are not included.
## How to Use
Before using the webapp, a json file containing player data must be constructed and stored in the `data` folder. This can be done by running the `json_constructor.py` file contained in the same folder. Some additional python libraries must be installed in order for `json_constructor.py` to run properly, namely `numpy`, `pandas`, and the `nba_api` libraries.
<!-- add section on how to host to local server -->
## Projection Methodology
The number of wins a team should accumulate over an 82 game season is determined by calculating the team's hypothetical win percentage, multiplying that number by 82, and rounding that number to the nearest integer. The hypothetical win percentage is determined by using a pythagorean-like formula originally published by Bill James and adapted to basketball by Oliver Dean. This formula maps win percentage as a function of a team's offensive rating (points generated per 100 possessions) and defensive rating (points allowed per 100 possessions).
$$Wins=82*ORTG^z/(ORTG^z+DRTG^z)$$
In this equation, the z value can be set to any number between 13 and 17, with higher pace seasons being higher on the range between those two numbers. This project sets z to 16.1615 since the values it generates are generally pretty accurate for the modern NBA.

A team's offensive rating and defensive rating is estimated by averaging the respective ratings of each player on the team and weighing them by each player's average possessions per game.
<!-- add summation formula for rating -->

Once these values are calculated, they are used in the wins formula to estimate that team's total wins.