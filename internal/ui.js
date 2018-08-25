const express = require("express");

module.exports = (app, db, config) => {
  //Static Resources
  app.get("/favicon.ico", (req, res) => res.sendFile(config.webPath + "/favicon.ico"));
  app.use("/static", express.static(config.webPath + "/static"))

  //The Home Page
  app.get("/", (req, res) => res.sendFile(config.webPath + "/index.html"));
  app.get("/submission", (req, res) => res.sendFile(config.webPath + "/submission.html"));
  app.get("/playlist-manager", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }
    res.sendFile(config.webPath + "/playlist-manager.html")
  });

  return this;
}
