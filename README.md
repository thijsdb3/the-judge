# The Judge

[This Website](https://the-judge-t15d.vercel.app/) is a fully functional web application built for the upcoming social deduction game The Judge.

The game has been **successfully playtested multiple times online**, and all core game mechanics are implemented.

**Note:** While the game is fully playable, the user experience (UX) still needs further polish to make the interface more intuitive.

## About the Game

**The Judge** is a social deduction game for 6–13 players. Unlike other social deduction games such as Werewolves, Avalon, and Town of Salem, **The Judge** introduces a player who is confirmed to be on the honest team and must figure out which of the other players are corrupt.

The rules can be found on the [Rules](https://the-judge.vercel.app/rules) tab.

## Demo
This demo showcases one complete game round, including:

- The Judge selecting a Partner
- The Partner selecting a Paralegal
- The Paralegal selecting an Associate
- The Associate and Paralegal each discarding one card and passing the remaining two cards to the Partner
- The Partner receiving all four cards and discarding the final card
- The scoreboard updating to show that 1 Blue card has been played

https://github.com/user-attachments/assets/d96a91ac-9caa-4cee-803f-dcdf0dd8cac7

## Tech Stack

- **Frontend:** Next.js, React, CSS
- **Backend:** Node.js, MongoDB, Pusher
- **Language:** JavaScript

---

## Features

- Authentication system (login/signup)
- Real-time lobby with player list
- Role assignment (Judge, Honest, Corrupt)
- Card phases and decision-making rounds
- Real-time game state synchronization
- Online multiplayer gameplay

---

## Current Problems / Known Issues

The project is fully playable, but a few issues remain to be addressed:

- **UX polish:** Some parts of the interface could be made more intuitive and user-friendly.
- **Production readiness:** The project was primarily developed and tested as a functional multiplayer prototype, so additional work is needed before considering it production-ready.
- **Game Limitation:** The current WebSocket implementation is designed for a single active game and does not yet support multiple games running concurrently.   


