// You Can Go To /admin and get an admin interface for stats and managemnt of user and songs and enable/disable public and presenter modes
const path = require("path");

var config = {};

config.httpPort = 80; // The Port The HTTP Listens On (Make Sure It Is A Callback URL In The Spotify Developer Console)
config.httpsPort = 443; // The Port The HTTPS Listens On
config.dnsPort = 53; // The Port The DNS Listens On
config.client_id = "{{Spotify API Client ID}}"; // The Spotify API Client ID
config.client_secret = "{{Spotify API Client Secret}}"; // The Spotify API Client Secret
config.playlist1 = "{{Playlist ID}}:{{Playlist Owners Spotify Username}}"; // Admin Dump Song To Playlist 1
config.maxSongsPerUser = 5; // Max Songs Each User Can Submit *Sessions*
config.totalSongLimit = 200; // Max Songs For Every User Combined
config.songTimeout = 10; // Minutes Between Song Being Removed and When it Can Be ReAdded
config.songRequestTimeout = 4; // If Song Requested More Than X Times After Being Already Played, Play It Again
config.cert = false; // Import SSL Certifciate Called cert.pem in the root folder (For Enterprise Firewalls CA Certs)
config.dns = false; // Enable Or Disable The DNS Rerouting Server (So That The Users Web Traffic Is Rerouted To This App If DNS Server Set In Your Router To This Machine)
config.https = false; // Enable Secure Web Traffic Using HTTPS (Put Certifcates in the root of the application called 'ssl_cert.pem' and 'ssl_key.pem'
config.serverIP = "192.168.1.2"; // Local IP Address Of The Server (Used For DNS)
config.url = "musicSuggestions.example.com"; // The Domain The Application Is Going To Be Running On
config.adminUsername = "admin"; // The Username For The '/admin/' interface
config.adminPassword = "password"; // The Password For The '/admin/' interface
config.spotifyReauthTimeout = 30; // How Many Minutes Between Reconnecting To The Spotify API
config.artworkCache = path.join(__dirname + '/album_art'); // Folder To Store Album Art
config.backupDir = path.join(__dirname + '/backup'); // Folder To Store Backups
config.backupTimeout = 5; // How Many Minutes Between Backups

module.exports = config;
