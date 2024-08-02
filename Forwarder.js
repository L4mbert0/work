const { Web3 } = require('web3');
const web3 = new Web3('https://sepolia.infura.io/v3/13c5d0003d704682b290ed46903a2bb1');
const web3_CB = new Web3('https://sepolia.infura.io/v3/9059b6f664f5402ab932aeecce4cd75f');

let isSending = false;
let lastBalance = 0n;

const senderAddress = '0x2Bcb7C6d22A62D07Fe56687B2848A1317A75AfEF';
const recipientAddress = '0xB8006B9626FeBdD46d11243cE30586E57518D7B1';
const privateKey = '0b46b98886967c07d6b9add20ed0ead741e078a6d1339c6830da2a2b2d157c26';

async function sendAllEthToRecipient() {
    try {
        const balance = BigInt(await web3.eth.getBalance(senderAddress));
        if (balance === 0n) {
            console.log('No balance to send.');
            return;
        }

        const nonce = await web3.eth.getTransactionCount(senderAddress, 'pending');
        let gasPrice = BigInt(await web3.eth.getGasPrice());
        gasPrice = BigInt(Math.round(Number(gasPrice) * 1.5))

        const gasEstimate = BigInt(await web3.eth.estimateGas({
            from: senderAddress,
            to: recipientAddress,
            value: balance
        }));

        const gasCost = gasEstimate * gasPrice;
        const valueToSend = balance - gasCost;

        if (valueToSend <= 0n) {
            lastBalance = balance;
            console.log(`Not enough balance to cover gas fees. Last Balance = ${web3.utils.fromWei(lastBalance.toString(), 'ether')} ETH`);
            return;
        }

        const tx = {
            from: senderAddress,
            to: recipientAddress,
            value: valueToSend.toString(),
            gas: gasEstimate.toString(),
            gasPrice: gasPrice.toString(),
            nonce: nonce,
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Transaction successful with hash:', receipt.transactionHash);
    } catch (error) {
        console.error('Error sending transaction:', error);
    } finally {
        isSending = false;
    }
}

async function checkBalanceAndSend() {
    const balance = BigInt(await web3_CB.eth.getBalance(senderAddress));
    console.log(`Balance of ${senderAddress}: ${web3_CB.utils.fromWei(balance.toString(), 'ether')} ETH`);

    if (balance > lastBalance && !isSending) {
        isSending = true;
        await sendAllEthToRecipient();
    }
}

async function sendEthManually() {
    if (!isSending) {
        isSending = true;
        await sendAllEthToRecipient();
    }
}

sendAllEthToRecipient()

setInterval(checkBalanceAndSend, 1000);
setInterval(sendEthManually, 10000);

