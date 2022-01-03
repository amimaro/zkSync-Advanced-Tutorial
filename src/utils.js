async function getZkSyncProvider(zksync, networkName) {
  let zkSyncProvider;
  try {
    zkSyncProvider = await zksync.getDefaultProvider(networkName);
  } catch (error) {
    console.log("Unable to connect to zkSync.");
    console.log(error);
  }
  return zkSyncProvider;
}

async function getEthereumProvider(ethers, networkName) {
  let ethersProvider;
  try {
    // eslint-disable-next-line new-cap
    ethersProvider = new ethers.getDefaultProvider(networkName);
  } catch (error) {
    console.log("Could not connect to Ethereum");
    console.log(error);
  }
  return ethersProvider;
}

async function initAccount(rinkebyWallet, zkSyncProvider, zksync) {
  const zkSyncWallet = await zksync.Wallet.fromEthSigner(
    rinkebyWallet,
    zkSyncProvider
  );
  return zkSyncWallet;
}

async function registerAccount(wallet, feeToken) {
  console.log(`Registering the ${wallet.address()} account on zkSync`);
  if (!(await wallet.isSigningKeySet())) {
    if ((await wallet.getAccountId()) === undefined) {
      throw new Error("Unknown account");
    }
    const changePubkey = await wallet.setSigningKey({
      feeToken,
      onchainAuth: true,
    });
    await changePubkey.awaitReceipt();
  }
  console.log(`Account ${wallet.address()} registered`);
}

async function depositToZkSync(zkSyncWallet, token, amountToDeposit, ethers) {
  const deposit = await zkSyncWallet.depositToSyncFromEthereum({
    depositTo: zkSyncWallet.address(),
    token: token,
    amount: ethers.utils.parseEther(amountToDeposit),
  });
  try {
    await deposit.awaitReceipt();
  } catch (error) {
    console.log("Error while awaiting confirmation from the zkSync operators.");
    console.log(error);
  }
}

async function transfer(
  from,
  toAddress,
  amountToTransfer,
  transferFee,
  token,
  zksync,
  ethers
) {
  console.log("transferFee", transferFee);
  const closestPackableAmount = zksync.utils.closestPackableTransactionAmount(
    ethers.utils.parseEther(amountToTransfer)
  );
  const closestPackableFee = zksync.utils.closestPackableTransactionFee(
    ethers.utils.parseEther(transferFee)
  );
  const transfer = await from.syncTransfer({
    to: toAddress,
    token: token,
    amount: closestPackableAmount,
    fee: closestPackableFee,
  });
  const transferReceipt = await transfer.awaitReceipt();
  console.log("Got transfer receipt.");
  console.log(transferReceipt);
}

async function getFee(transactionType, address, token, zkSyncProvider, ethers) {
  const feeInWei = await zkSyncProvider.getTransactionFee(
    transactionType,
    address,
    token
  );
  // TODO: check why fee is not enough
  return ethers.utils.formatEther((feeInWei.totalFee * 10).toString());
}

async function withdrawToEthereum(
  wallet,
  amountToWithdraw,
  withdrawalFee,
  token,
  zksync,
  ethers
) {
  const closestPackableAmount = zksync.utils.closestPackableTransactionAmount(
    ethers.utils.parseEther(amountToWithdraw)
  );
  const closestPackableFee = zksync.utils.closestPackableTransactionFee(
    ethers.utils.parseEther(withdrawalFee)
  );
  const withdraw = await wallet.withdrawFromSyncToEthereum({
    ethAddress: wallet.address(),
    token: token,
    amount: closestPackableAmount,
    fee: closestPackableFee,
  });
  await withdraw.awaitVerifyReceipt();
  console.log("ZKP verification is complete");
}

async function displayZkSyncBalance(wallet, ethers, name) {
  const state = await wallet.getAccountState();
  if (state.committed.balances.ETH) {
    console.log(
      `Committed ETH balance for ${wallet.address()}(${name}): ${ethers.utils.formatEther(
        state.committed.balances.ETH
      )}`
    );
  } else {
    console.log(`Committed ETH balance for ${wallet.address()}(${name}): 0`);
  }
  if (state.verified.balances.ETH) {
    console.log(
      `Verified ETH balance for ${wallet.address()}(${name}): ${ethers.utils.formatEther(
        state.verified.balances.ETH
      )}`
    );
  } else {
    console.log(`Verified ETH balance for ${wallet.address()}(${name}): 0`);
  }
}

module.exports = {
  getZkSyncProvider,
  getEthereumProvider,
  depositToZkSync,
  registerAccount,
  displayZkSyncBalance,
  transfer,
  withdrawToEthereum,
  getFee,
  initAccount,
};
