<p align="center"><a href="https://hapxs-surl.com" title="hapxs-surl.it"><img src="https://raw.githubusercontent.com/thedevs-network/hapxs-surl/9d1c873897c3f5b9a1bd0c74dc5d23f2ed01f2ec/static/images/logo-github.png" alt="hapxs-surl.it"></a></p>

# hapxs-surl.it

**hapxs-surl** is a modern URL shortener with support for custom domains. Create and edit links, view statistics, manage users, and more.

[https://hapxs-surl.com](https://hapxs-surl.com)


[![docker-build-release](https://github.com/devhappys/hapxs-surl/actions/workflows/docker-build-release.yaml/badge.svg)](https://github.com/devhappys/hapxs-surl/actions/workflows/docker-build-release.yaml)
[![Uptime Status](https://uptime.betterstack.com/status-badges/v2/monitor/1ogaa.svg)](https://status.hapxs-surl.it)
[![Contributions](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/devhappys/hapxs-surl/#contributing)
[![GitHub license](https://img.shields.io/github/license/thedevs-network/hapxs-surl.svg)](https://github.com/devhappys/hapxs-surl/blob/develop/LICENSE)

## Table of contents

- [Key features](#key-features)
- [Donations and sponsors](#donations-and-sponsors)
- [Setup](#setup)
- [Docker](#docker)
- [API](#api)
- [Configuration](#configuration)
- [Themes and customizations](#themes-and-customizations)
- [Browser extensions](#browser-extensions)
- [Videos](#videos)
- [Integrations](#integrations)
- [Contributing](#contributing)

## Key features

- Created with self-host in mind:
  - Zero configuration needed
  - Easy setup with no build step
  - Supporting various databases (SQLite, Postgres, MySQL)
  - Ability to disable registration and anonymous links
- Custom domain support
- Set custom URLs, password, description, and expiration time for links
- View, edit, delete and manage your links
- Private statistics for shortened URLs
- Admin page to manage users and links
- Customizability and themes
- RESTful API

## Donations and sponsors

Support the development of hapxs-surl by making a donation or becoming an sponsor.

[Donate or sponsor →](https://btcpay.hapxs-surl.it/apps/L9Gc7PrnLykeRHkhsH2jHivBeEh/crowdfund)

## Setup

The only prerequisite is [Node.js](https://nodejs.org/) (version 20 or above). The default database is SQLite. You can optionally install Postgres or MySQL/MariaDB for the database or Redis for the cache. 

When you first start the app, you're prompted to create an admin account.

1. Clone this repository or [download the latest zip](https://github.com/devhappys/hapxs-surl/releases)
2. Install dependencies: `npm install`
3. Initialize database: `npm run migrate`
5. Start the app for development `npm run dev` or production `npm start`

## Docker

Make sure Docker is installed, then you can start the app from the root directory:

```sh
docker compose up
```

Various docker-compose configurations are available. Use `docker compose -f <file_name> up` to start the one you want:

- [`docker-compose.yml`](./docker-compose.yml): Default hapxs-surl setup. Uses SQLite for the database.
- [`docker-compose.sqlite-redis.yml`](./docker-compose.sqlite-redis.yml): Starts hapxs-surl with SQLite and Redis.
  - Required environment variable: `REDIS_ENABLED`
- [`docker-compose.postgres.yml`](./docker-compose.postgres.yml): Starts hapxs-surl with Postgres and Redis.
  - Required environment variables: `REDIS_ENABLED`, `DB_PASSWORD`, `DB_NAME`, `DB_USER`
- [`docker-compose.mariadb.yml`](./docker-compose.mariadb.yml): Starts hapxs-surl with MariaDB and Redis.
  - Required environment variables: `REDIS_ENABLED`, `DB_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PORT`

Official hapxs-surl Docker image is available on [Docker Hub](https://hub.docker.com/r/hapxs-surl/hapxs-surl).

## API

[View API documentation →](https://docs.hapxs-surl.it)

## Configuration

The app is configured via environment variables. You can pass environment variables directly or create a `.env` file. View [`.example.env`](./.example.env) file for the list of configurations.

All variables are optional except `JWT_SECRET` which is required on production. 

You can use files for each of the variables by appending `_FILE` to the name of the variable. Example: `JWT_SECRET_FILE=/path/to/secret_file`.

| Variable | Description | Default | Example |
| -------- | ----------- | ------- | ------- |
| `JWT_SECRET` | This is used to sign authentication tokens. Use a **long** **random** string. | - | - |
| `PORT` |  The port to start the app on | `3000` | `8888` |
| `SITE_NAME` |  Name of the website | `hapxs-surl` | `Your Site` |
| `DEFAULT_DOMAIN` |  The domain address that this app runs on | `localhost:3000` | `yoursite.com` |
| `LINK_LENGTH` | The length of of shortened address | `6` | `5` |
| `LINK_CUSTOM_ALPHABET` | Alphabet used to generate custom addresses. Default value omits o, O, 0, i, I, l, 1, and j to avoid confusion when reading the URL. | (abcd..789) | `abcABC^&*()@` |
| `DISALLOW_REGISTRATION` | Disable registration. Note that if `MAIL_ENABLED` is set to false, then the registration would still be disabled since it relies on emails to sign up users. | `true` | `false` |
| `DISALLOW_ANONYMOUS_LINKS` | Disable anonymous link creation | `true` | `false` |
| `TRUST_PROXY` | If the app is running behind a proxy server like NGINX or Cloudflare and that it should get the IP address from that proxy server. If you're not using a proxy server then set this to false, otherwise users can override their IP address. | `true` | `false` |
| `DB_CLIENT` |  Which database client to use. Supported clients: `pg` or `pg-native` for Postgres, `mysql2` for MySQL or MariaDB, `sqlite3` and `better-sqlite3` for SQLite. NOTE: `pg-native` and `sqlite3` are not installed by default, use `npm` to install them before use. | `better-sqlite3` | `pg` |
| `DB_FILENAME` |  File path for the SQLite database. Only if you use SQLite. | `db/data` | `/var/lib/data` |
| `DB_HOST` | Database connection host. Only if you use Postgres or MySQL. | `localhost` | `your-db-host.com` |
| `DB_PORT` | Database port. Only if you use Postgres or MySQL. | `5432` (Postgres) | `3306` (MySQL) |
| `DB_NAME` | Database name. Only if you use Postgres or MySQL. | `hapxs-surl` | `mydb` |
| `DB_USER` | Database user. Only if you use Postgres or MySQL. | `postgres` | `myuser` |
| `DB_PASSWORD` | Database password. Only if you use Postgres or MySQL. | - | `mypassword` |
| `DB_SSL` | Whether use SSL for the database connection. Only if you use Postgres or MySQL. | `false` | `true` |
| `DB_POOL_MIN` | Minimum number of database connection pools. Only if you use Postgres or MySQL. | `0` | `2` |
| `DB_POOL_MAX` | Maximum number of database connection pools. Only if you use Postgres or MySQL. | `10` | `5` |
| `REDIS_ENABLED` | Whether to use Redis for cache | `false` | `true` |
| `REDIS_HOST` | Redis connection host | `127.0.0.1` | `your-redis-host.com` |
| `REDIS_PORT` | Redis port | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis password | - | `mypassword` |
| `REDIS_DB` | Redis database number, between 0 and 15. | `0` | `1` |
| `SERVER_IP_ADDRESS` | The IP address shown to the user on the setting's page. It's only for display purposes and has no other use. | - | `1.2.3.4` |
| `SERVER_CNAME_ADDRESS` | The subdomain shown to the user on the setting's page. It's only for display purposes and has no other use. | - | `custom.yoursite.com` |
| `CUSTOM_DOMAIN_USE_HTTPS` | Use https for links with custom domain. It's on you to generate SSL certificates for those domains manually—at least on this version for now. | `false` | `true` |
| `ENABLE_RATE_LIMIT` | Enable rate limiting for some API routes. If Redis is enabled uses Redis, otherwise, uses memory. | `false` | `true` |
| `MAIL_ENABLED` | Enable emails, which are used for signup, verifying or changing email address, resetting password, and sending reports. If is disabled, all these functionalities will be disabled too. | `false` | `true` | 
| `MAIL_HOST` | Email server host | - | `your-mail-server.com` |
| `MAIL_PORT` | Email server port | `587` | `465` (SSL) | 
| `MAIL_USER` | Email server user | - | `myuser` | 
| `MAIL_PASSWORD` | Email server password for the user | - | `mypassword` | 
| `MAIL_FROM` | Email address to send the user from | - | `example@yoursite.com` | 
| `MAIL_SECURE` | Whether use SSL for the email server connection | `false` | `true` | 
| `REPORT_EMAIL` | The email address that will receive submitted reports | - | `example@yoursite.com` | 
| `CONTACT_EMAIL` | The support email address to show on the app | - | `example@yoursite.com` | 

## Themes and customizations

You can add styles, change images, or render custom HTML. Place your content inside the [`/custom`](./custom) folder according to below instructions.

#### How it works:

The structure of the custom folder is like this:

```
custom/
├─ css/
│  ├─ custom1.css
│  ├─ custom2.css
│  ├─ ...
├─ images/
│  ├─ logo.png
│  ├─ favicon.ico
│  ├─ ...
├─ views/
│  ├─ partials/
│  │  ├─ footer.hbs
│  ├─ 404.hbs
│  ├─ ...
```

- **css**: Put your CSS style files here. ([View example →](https://github.com/devhappys/hapxs-surl-customizations/tree/main/themes/crimson/css))
  - You can put as many style files as you want: `custom1.css`, `custom2.css`, etc.
  - If you name your style file `styles.css`, it will replace hapxs-surl's original `styles.css` file.
  - Each file will be accessible by `<your-site.com>/css/<file>.css`
- **images**: Put your images here. ([View example →](https://github.com/devhappys/hapxs-surl-customizations/tree/main/themes/crimson/images))
  - Name them just like the files inside the [`/static/images/`](./static/images) folder to replace hapxs-surl's original images.
  - Each image will be accessible by `<your-site.com>/images/<image>.<image-format>`
- **views**: Custom HTML templates to render. ([View example →](https://github.com/devhappys/hapxs-surl-customizations/tree/main/themes/crimson/views))
  - It should follow the same file naming and folder structure as [`/server/views`](./server/views)
  - Although we try to keep the original file names unchanged, be aware that new changes on hapxs-surl might break your custom views.
 
#### Example theme: Crimson

This is an example and official theme. Crimson includes custom styles, images, and views.

[Get Crimson theme →](https://github.com/devhappys/hapxs-surl-customizations/tree/main/themes/crimson)

[View list of themes and customizations →](https://github.com/devhappys/hapxs-surl-customizations)


| Homepage | Admin page | Login/signup |
| -------- | ---------- | ------------ |
| ![crimson-homepage](https://github.com/user-attachments/assets/b74fab78-5e80-4f57-8425-f0cc73e9c68d) | ![crimson-admin](https://github.com/user-attachments/assets/a75d2430-8074-4ce4-93ec-d8bdfd75d917) | ![crimson-login-signup ](https://github.com/user-attachments/assets/b915eb77-3d66-4407-8e5d-b556f80ff453)

#### Usage with Docker:

If you're building the image locally, then the `/custom` folder should already be included in your app.

If you're pulling the official image, make sure `/hapxs-surl/custom` volume is mounted or you have access to it. [View Docker compose example →](https://github.com/devhappys/hapxs-surl/blob/main/docker-compose.yml#L7)

Then, move your files to that volume. You can do it with this Docker command:

```sh
docker cp <path-to-custom-folder> <hapxs-surl-container-name>:/hapxs-surl
```

For example:

```sh
docker cp custom hapxs-surl-server-1:/hapxs-surl
```

Make sure to restart the hapxs-surl server container after copying files or making changes.

## Browser extensions

Download hapxs-surl's extension for web browsers via below links.

- [Chrome](https://chrome.google.com/webstore/detail/hapxs-surl/pklakpjfiegjacoppcodencchehlfnpd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/hapxs-surl/)

## Videos

**Official videos**

- [Next.js to htmx – A Real World Example](https://www.youtube.com/watch?v=8RL4NvYZDT4)

## Integrations

- **ShareX** – You can use hapxs-surl as your default URL shortener in [ShareX](https://getsharex.com/). If you host your custom instance of hapxs-surl, refer to [ShareX wiki](https://github.com/devhappys/hapxs-surl/wiki/ShareX) on how to setup.
- **Alfred workflow** – Download hapxs-surl's official workflow for [Alfred](https://www.alfredapp.com/) app from [alfred-hapxs-surl](https://github.com/thedevs-network/alfred-hapxs-surl) repository.
- **iOS shortcut** – [hapxs-surl shortcut](https://www.icloud.com/shortcuts/a829856aea2c420e97c53437e68b752b) for your apple device which works from the iOS sharing context menu or on standalone mode. A courtesy of [@caneeeeee](https://github.com/caneeeeee).

**Third-party packages**


| Language        | Link                                                                              | Description                                          |
| --------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| C# (.NET)       | [hapxs-surlSharp](https://github.com/0xaryan/hapxs-surlSharp)                                 | .NET package for hapxs-surl.it url shortener               |
| C# (.NET)       | [hapxs-surl.NET](https://github.com/AlphaNecron/hapxs-surl.NET)                               | C# API Wrapper for hapxs-surl                              |
| Python          | [hapxs-surl-cli](https://github.com/RealAmirali/hapxs-surl-cli)                               | Command-line client for hapxs-surl written in Python       |
| Ruby            | [hapxs-surl.rb](https://github.com/RealAmirali/hapxs-surl.rb)                                 | hapxs-surl library written in Ruby                         |
| Rust            | [urlshortener](https://github.com/vityafx/urlshortener-rs)                        | URL shortener library written in Rust                |
| Rust            | [hapxs-surl-rs](https://github.com/robatipoor/hapxs-surl-rs)                                  | Command line tool written in Rust                    |
| Node.js         | [node-hapxs-surl](https://github.com/ardalanamini/node-hapxs-surl)                            | Node.js client for hapxs-surl.it url shortener             |
| JavaScript      | [hapxs-surl-vscode](https://github.com/mehrad77/hapxs-surl-vscode)                            | Visual Studio Code extension for hapxs-surl                |
| Java            | [hapxs-surl-desktop](https://github.com/cipher812/hapxs-surl-desktop)                         | A Cross platform Java desktop application for hapxs-surl   |
| Go              | [hapxs-surl-go](https://github.com/raahii/hapxs-surl-go)                                      | Go client for hapxs-surl.it url shortener                  |
| BASH            | [GitHub Gist](https://gist.github.com/hashworks/6d6e4eae8984a5018f7692a796d570b4) | Simple BASH function to access the API               |
| BASH            | [url-shortener](https://git.tim-peters.org/Tim/url-shortener)                     | Simple BASH script with GUI                          |
| Kubernetes/Helm | [ArtifactHub](https://artifacthub.io/packages/helm/christianhuth/hapxs-surl)            | A Helm Chart to install hapxs-surl on a Kubernetes cluster |

## Contributing

Pull requests are welcome. Open a discussion for feedback, requesting features, or discussing ideas.

Special thanks to [Thomas](https://github.com/trgwii) and [Muthu](https://github.com/MKRhere). Logo design by [Muthu](https://github.com/MKRhere).

