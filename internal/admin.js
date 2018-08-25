module.exports = (app, db, config) => {
  app.get("/admin", (req, res) => {
    if(!req.session.admin) {
      res.sendFile(config.webPath + "/login.html");
    } else {
      res.send("Your Are Already Logged In. You Can Navigate To \"/logout\" To Logout!");
    }
  });

  app.post("/admin", (req, res) => {
    if(req.body.password === config.webAdminPassword) {
      req.session.admin = true;
      res.redirect("/");
    } else {
      res.status(401).send("Incorrect Login")
    }
  });

  app.get("/logout", (req, res) => {
    req.session.admin = null;
    res.clearCookie('musicSuggestionsID');
    res.redirect("/");
  });

  return this;
}
