require("dotenv").config();
require("./bob.js");
require("./alice.js");

process.on("SIGINT", () => {
  console.log("Disconnecting");
  // Disconnect
  process.exit();
});
