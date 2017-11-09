# MusicSubmittions
A Web Application For Users To Submit and Vote On Music Suggestions During An Event.
User Can Go To A Website On Thier Device (Or Be Redirected By DNS) and can vote and submit music. This application uses the Spotify API to check that the song exists. There is also the ability to remove songs, view whether they are explicit and dump them into a playlist on Spotify so you can play them. 

## Features
* Submit Songs
* Vote On Songs
* Check Songs Exist On Spotify
* Can Remove Songs (Admin)
* Dump The Songs Into Spotify playlist (Admin)
* Marks Explicit Songs (Admin)
* Modes:
  * User (Default) (For People Who Come To The Event)
  * Admin (For Event Organisers)
  * Presenter (For Putting On Screen (No Voting Or Submitting Songs))
  * Public (For A Public Device To Submit Songs (No Voting))

## Users View
![alt text](https://github.com/oscartbeaumont/MusicSubmittions/blob/master/docs/users-view.png "Users View")

## Admin View ('/admin')
![alt text](https://github.com/oscartbeaumont/MusicSubmittions/blob/master/docs/admins-view.png "Admin View")

## Installation

```bash
git clone https://github.com/oscartbeaumont/MusicSubmittions.git
cd MusicSubmittions
mkdir album_art
mkdir backup
npm install
node main.js
```
You can use the config.js file to configure the application. At the bottom of the main.js file you can uncomment a line if you would like to import music from a Spotify playlist on startup (WARNING This Feature Has Been Acting Wierd).

### Thanks To All Of The Developers Who Built The Frameworks This Is Build On.
* Font Awesome
* Bootstrap
* Chartist.js
* dnsd
* https
* http
* express
* express-session
* express-subdomain
* basic-auth
* request
* spotify-web-api-node
* body-parser
* cookie-parser
* querystring
* opn
* fs
* dns
* useragent
* url
* httpsReq
* path
* Moment
* util
* And Any Others I Have Missed
