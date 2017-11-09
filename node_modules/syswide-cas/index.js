const fs = require("fs");
const path = require("path");
const tls = require("tls");

const rootCAs = [];

// for node 7.2 and up, trapping method must be used.
var useTrap = false;
const parts = process.versions.node.split(".");
const major = parseInt(parts[0]);
const minor = parseInt(parts[1]);
if (major > 7 || (major == 7 && minor >= 2)) {
  useTrap = true;
}

// create an empty secure context loaded with the root CAs
const rootSecureContext = tls.createSecureContext ? tls.createSecureContext() : require("crypto").createCredentials();

function addDefaultCA(file) {
  try {
    var cert;
    var content = fs.readFileSync(file, { encoding: "ascii" }).trim();
    if (content.indexOf("-----BEGIN CERTIFICATE-----") === 0) {
      var certs = content.split("-----END CERTIFICATE-----");
      for (var i = 0; i < certs.length; ++i) {
        cert = certs[i].trim();
        if (cert.length > 0) {
          cert += "\n-----END CERTIFICATE-----\n";
          rootCAs.push(cert);
          // this will add the cert to the root certificate authorities list
          // which will be used by all subsequent secure contexts with root CAs.
          // this only works up to node 6. node 7 and up it has no affect.
          if (!useTrap) {
            rootSecureContext.context.addCACert(cert);
          }
        }
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      console.log("failed reading file " + file + ": " + e.message);
    }
  }
}

exports.addCAs = function(dirs) {
  if (!dirs) {
    return;
  }

  if (typeof dirs === "string") {
    dirs = dirs.split(",").map(function(dir) {
      return dir.trim();
    });
  }

  var files, stat, file, i, j;
  for (i = 0; i < dirs.length; ++i) {
    try {
      stat = fs.statSync(dirs[i]);
      if (stat.isDirectory()) {
        files = fs.readdirSync(dirs[i]);
        for (j = 0; j < files.length; ++j) {
          file = path.resolve(dirs[i], files[j]);
          try {
            stat = fs.statSync(file);
            if (stat.isFile()) {
              addDefaultCA(file);
            }
          } catch (e) {
            if (e.code !== "ENOENT") {
              console.log("failed reading " + file + ": " + e.message);
            }
          }
        }
      } else {
        addDefaultCA(dirs[i]);
      }
    } catch (e) {
      if (e.code !== "ENOENT") {
        console.log("failed reading " + dirs[i] + ": " + e.message);
      }
    }
  }
};

if (useTrap) {
  // trap the createSecureContext method and inject custom root CAs whenever invoked
  const origCreateSecureContext = tls.createSecureContext;
  tls.createSecureContext = function(options) {
    var c = origCreateSecureContext.apply(null, arguments);
    if (!options.ca && rootCAs.length > 0) {
      rootCAs.forEach(function(ca) {
        // add to the created context our own root CAs
        c.context.addCACert(ca);
      });
    }
    return c;
  };
}

const defaultCALocations = ["/etc/ssl/ca-node.pem"];

exports.addCAs(defaultCALocations);
