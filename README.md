# hft-intern

Welcome to the HFT Intern repo, a [discord.py](https://github.com/Rapptz/discord.py) project for the `HFT Intern` Discord bot.

This codebase is designed to be run on https://fly.io in production, but can be run locally with Node.js for development purposes.

![HFT Intern](HFTIntern.png?raw=true)

# Initial Setup

## Local Dependencies

To run the application locally, you must have the following installed. It is recommended to use a package manager (like Homebrew on Mac OS X) to install each of the following:

- [Node.js](https://nodejs.org/en/) (18.X, - should include NPM)
  - macOS: `brew install node@18`
- [pre-commit](https://pre-commit.com/)
  - macOS: `brew install pre-commit`

## Local Setup

1. Clone this repository locally with `git clone https://github.com/HaloFunTime/hft-intern.git`
1. Create a local `.env` by running the command `cp .env.example .env` (and then adding actual values to the variables in the `.env` file as needed)
1. For ease of use, make all `dev-`-prefixed shell scripts directly executable by issuing the following shell command: `find dev-*.sh | xargs chmod +x`

## First-time run Setup

1. Run your local application for the first time by running the script `./dev-start.sh`
1. Confirm that the Discord Bot represented by your `BOT_TOKEN` shows as "online" when viewed through Discord
1. Kill your local application by either using CTRL+C in the shell in which it's running, or by running the script `./dev-stop.sh`

Docker is configured to build one container - it will be running the Discord.py script and will be called `hftintern` in the logs. Setup specifics can be viewed in the `docker-compose.yml` file.

# Active Development Guidelines

## Quickstart

1. Make changes to JavaScript files as needed
1. Run your local application with `./dev-start.sh`
1. Stop your dev application with `./dev-stop.sh` (or CTRL+C) when you're done
1. Bundle your changes into git commits on a branch not named `main`, and push your branch to the origin repository
1. Open a pull request from your branch targeting the `main` branch

## Stylistic Conventions

Variables and function declarations in Python code are to be named using the `snake_case` convention.

## Development Scripts

Use `dev-start.sh` and `dev-stop.sh` to start and stop the application locally.

- `dev-format.sh`: Auto-formats all files in the codebase
- `dev-start.sh`: Runs the application using Node.js (saves server process ID to `intern.pid`)
- `dev-stop.sh`: Stops the running application (sends SIGINT to the process ID in `intern.pid`)

## DevX Notes

Several quality-of-life features are baked in via this repository's `pre-commit` config, including elimination of trailing whitespace, EOF auto-add, YAML formatting, autoformatting with `prettier`, and JavaScript linting with `eslint`.

Most development scripts exist to simplify the dev flow for newer developers; for those contributors who are more experienced, feel free to manually execute commands within Docker containers and break the "rules" as appropriate. It is our explicit goal that this project be very approachable for new developers, so please default to simplicity when possible.
