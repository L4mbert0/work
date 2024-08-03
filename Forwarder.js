const { Web3 } = require('web3');
const web3 = new Web3('https://mainnet.infura.io/v3/13c5d0003d704682b290ed46903a2bb1');
const web3_CB = new Web3('https://mainnet.infura.io/v3/9059b6f664f5402ab932aeecce4cd75f');

let isSending = false;
let lastBalance = 0n;

const senderAddress = '0x171C611Bded0297254Ea5702B3530c462fDAD73a';
const recipientAddress = '0x1B32067F96436c680935ACe026329DcceC143E36';
const privateKey = '0x791d5c94d683f6d910383aa4cf2ff18e7d5fbf4c2b9fcc722e9ec2e44174e7f2';

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
