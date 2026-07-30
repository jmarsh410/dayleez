# Game Architecture

All games made for Dayleez website should follow these architecture rules

- There is a base game page that displays the game for today's date. this page can be accessed by all users, whether they are logged in or not.
- initial game state is derived from json data in the game's directory. the json data is named by date. for example 2026-07-12
- if user it trying to view today's game, but there is no json file for that date then show them the most recent game from the past
- below the game UI, there are previous/next buttons that allow the user to navigate to past and future games. if no json file exists for the past or future date, then the button does not display
- games for previous days can be accessed via a dynamic [date] route. these pages can only be accessed by users who are logged in. If a user who is not logged in attempts to access this page, they are sent to the 'sign up' page.
- game state should be saved in the database for logged in users. any interaction that changes game state should be saved in the database
- if a user is not logged in and plays a game save their game state to localstorage, using the syntax [game]-[date]. for not logged in users who refresh the page, attempt to populate the game state from localstorage.
- you can use the digout game as a good example of this achitecture
