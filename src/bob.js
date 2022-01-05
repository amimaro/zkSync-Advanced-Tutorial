(async () => {
  const ethers = require("ethers");
  const zksync = require("zksync");
  const utils = require("./utils");
  const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 5000;
  const token = process.env.ZKSYNC_TOKEN || "ETH";

  const zkSyncProvider = await utils.getZkSyncProvider(
    zksync,
    process.env.NETWORK_NAME
  );
  const ethersProvider = await utils.getEthereumProvider(
    ethers,
    process.env.NETWORK_NAME
  );

  const bobRinkebyWallet = new ethers.Wallet(
    process.env.BOB_PRIVATE_KEY,
    ethersProvider
  );

  console.log(`Bob's Rinkeby address is: ${bobRinkebyWallet.address}`);
  const bobZkSyncWallet = await utils.initAccount(
    bobRinkebyWallet,
    zkSyncProvider,
    zksync
  );

  const tokenSet = zkSyncProvider.tokenSet;
  const bobInitialRinkebyBalance = await bobZkSyncWallet.getEthereumBalance(
    token
  );
  console.log(
    `Bob's initial balance on Rinkeby is: ${tokenSet.formatToken(
      token,
      bobInitialRinkebyBalance
    )}`
  );

  setInterval(async () => {
    await utils.displayZkSyncBalance(bobZkSyncWallet, ethers, "Bob");
    console.log("---");
  }, SLEEP_INTERVAL);
})();
