# Music Suggestions
A web app for choosing & voting on music for events! It allows for submitting and voting on music to be played at events like socials and parties. It also uses cookies to stop people from voting multiple times and allows for an admin to remove songs, export & import to a spotify playlist and see if a song is explicit. It is based on the Spotify API which is used for checking that songs exist and getting information about them.

## Features
* Suggest Songs (Which Are Checked To Exist On Spotify)
* Vote On Songs
* Can Remove Songs (Admin)
* Dump and Load From Spotify Playlist's (Admin)
* Shows Explicit Songs (Admin)

## Users View
![alt text](https://github.com/oscartbeaumont/MusicSubmittions/blob/master/docs/users-view.png "Users View")

## Admin View
![alt text](https://github.com/oscartbeaumont/MusicSubmittions/blob/master/docs/admins-view.png "Admin View")

## Installation
## Deployment With Docker
Music Suggestions can be deplpoyed using Docker which makes it much easier to update and install. Below are the commands to use it.
```bash
docker volume create MusicSuggestionsData
docker run -d --name MusicSuggestions -p 8080:8080 -v MusicSuggestionsData:/usr/src/app oscartbeaumont/musicsuggestions
```

## Deploying Without Docker or Developing On Music Suggestions
You can refer to the Dockerfile and the Package.json scripts for how to manually install it.

# How To Use
The application has a web interface and a config for management. The Config Files Options Are In The Next Section. The Other Two Are:
* / - This Interface Is Where You Send Your Users To. When In Admin Mode Extra Features Are Unlocked In This Page.
* /admin - This is where you login to enable the admin features.
* /logout - Logout as an admin user.

## Config Options
You can use the config.js file to configure the application with the options below. The ">" symbol means put it into an object.

| Option Name        | Type   | Default Value                | Description                               |
|--------------------|--------|------------------------------|-------------------------------------------|
| http               | Int    | 80                           | The HTTP Server Port                      |
| webAdminPassword   | String | password                     | The Password For The Admin Interface      |
| sessionSecret      | String |                              | A Random String For Securing The Sessions |
| spotify > id       | String |                              | Your Spotify API ID                       |
| spotify > secret   | String |                              | Your Spotify API Secret                   |
| spotify > callback | String | https://example.com/callback | Your Applications Public URL. "/callback" |
| proxy              | String | 192.168.1.1                  | The IP Of Your Proxy (eg. Nginx)          |

### Thanks To All Of The Frameworks And Librarys This Is Built On
* VueJS
* Bootstrap
* Express
* Spotify Web API Node
* And Many Others
