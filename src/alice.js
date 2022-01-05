(async () => {
  const ethers = require("ethers");
  const zksync = require("zksync");
  const utils = require("./utils");
  const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 5000;
  const token = process.env.ZKSYNC_TOKEN || "ETH";
  const amountToDeposit = "6.0";
  const amountToTransfer = "2.0";
  const amountToWithdraw = "2.0";

  const zkSyncProvider = await utils.getZkSyncProvider(
    zksync,
    process.env.NETWORK_NAME
  );
  const ethersProvider = await utils.getEthereumProvider(
    ethers,
    process.env.NETWORK_NAME
  );
  console.log("Creating a new Rinkeby wallet for Alice");
  const aliceRinkebyWallet = new ethers.Wallet(
    process.env.ALICE_PRIVATE_KEY,
    ethersProvider
  );
  console.log(`Alice's Rinkeby address is: ${aliceRinkebyWallet.address}`);

  console.log("Creating a zkSync wallet for Alice");
  const aliceZkSyncWallet = await utils.initAccount(
    aliceRinkebyWallet,
    zkSyncProvider,
    zksync
  );

  const tokenSet = zkSyncProvider.tokenSet;
  const aliceInitialRinkebyBalance = await aliceZkSyncWallet.getEthereumBalance(
    token
  );
  console.log(
    `Alice's initial balance on Rinkeby is: ${tokenSet.formatToken(
      token,
      aliceInitialRinkebyBalance
    )}`
  );

  await aliceZkSyncWallet.approveERC20TokenDeposits(token);

  // Display balance
  setInterval(async () => {
    await utils.displayZkSyncBalance(aliceZkSyncWallet, tokenSet, "Alice");
    console.log("---");
  }, SLEEP_INTERVAL);

  console.log("Depositing");
  await utils.depositToZkSync(
    aliceZkSyncWallet,
    token,
    amountToDeposit,
    tokenSet
  );
  await utils.displayZkSyncBalance(aliceZkSyncWallet, tokenSet);
  await utils.registerAccount(aliceZkSyncWallet, token);

  console.log("Transferring");
  const transferFee = await utils.getFee(
    "Transfer",
    aliceRinkebyWallet.address,
    token,
    zkSyncProvider,
    tokenSet
  );
  await utils.transfer(
    aliceZkSyncWallet,
    process.env.BOB_ACTUAL_ADDRESS,
    amountToTransfer,
    transferFee,
    token,
    zksync,
    tokenSet
  );

  console.log("Withdrawing");
  const withdrawalFee = await utils.getFee(
    "Withdraw",
    aliceRinkebyWallet.address,
    token,
    zkSyncProvider,
    tokenSet
  );
  await utils.withdrawToEthereum(
    aliceZkSyncWallet,
    amountToWithdraw,
    withdrawalFee,
    token,
    zksync,
    tokenSet
  );
})();
