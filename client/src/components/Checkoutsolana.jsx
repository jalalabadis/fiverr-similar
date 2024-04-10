// pages/solana.js
import { useEffect, useState } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { ORDER_SOLANA_SUCCESS_ROUTE, PUBKEY } from '../utils/constants';
import axios  from 'axios';
import { useRouter } from 'next/router';

const Checkoutsolana = ({gigPrice}) => {
  const [wallet, setWallet] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletAmount, setWalletAmount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { gigId } = router.query;

  const lamportsPerSol = 1000000000;


  const connectWallet = async () => {
    setIsLoading(true);
    if (typeof window.solana === 'undefined') {
      window.open('https://phantom.app/');
      setIsLoading(false);
      setError('Phantom extension is not installed');
      return;
    }

    try {
      const resp = await window.solana.connect();
      setWallet(resp);
      setStatus('Connected');
      setIsLoading(false);
      const connection = new Connection('https://api.devnet.solana.com');
          const balance = await connection.getBalance(resp.publicKey);
          setWalletAmount(balance);
      setWalletAddress(resp.publicKey.toString());
      document.getElementById('payment-form').style.display = 'none';
    } catch (err) {
      console.error('Error connecting wallet:', err);
    }
  };

    

  const sendMoney = async () => {
    setIsLoading(true);
    try {
      if (!wallet) {
        setError('Wallet not connected');
        return;
      }

      const network = "https://api.devnet.solana.com";
      const connection = new Connection(network);

      const destPubkeyStr = PUBKEY;
      console.log(destPubkeyStr);
      const destPubkey = new PublicKey(destPubkeyStr);
      console.log(gigPrice)
      const lamports = parseInt(gigPrice) * lamportsPerSol;

      const instruction = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: destPubkey,
        lamports,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = wallet.publicKey;

      const hash = await connection.getRecentBlockhash();
      transaction.recentBlockhash = hash.blockhash;

      const signature = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature, "singleGossip");
       // Send signed transaction to server
    await sendTransactionToServer(signature);
      console.log("Money sent:", signature);
      setError(null);
    } catch (error) {
      setIsLoading(false);
      console.log('Error sending money:', error);
      setError('Failed to send money');
    };

  };





  const sendTransactionToServer = async (signedTransaction) => {
    try {
      console.log(ORDER_SOLANA_SUCCESS_ROUTE);
      const response = await axios.post(ORDER_SOLANA_SUCCESS_ROUTE, {gigId, signedTransaction }, { withCredentials: true });
  
      if (response.status >= 200 && response.status < 300) {
        // Request was successful
        console.log('Transaction sent successfully');
        router.push('/buyer/orders');
    } else {
        // Request failed with an error status code
        setError('Failed to send transaction to server');
    }
    } catch (error) {
      setError('Failed to send transaction to server');
      console.error('Error sending transaction to server:', error);
      setIsLoading(false);
    }
  };





  return (
    <div className='w-96'>{
      wallet?
      <div className="max-w-sm border-[#000044] bg-[#000000] text-white shadow-md rounded-lg overflow-hidden mx-auto relative">
      <span className={`rounded-full h-3 w-3 ${status === 'Connected' ? 'bg-green-500' : 'bg-red-500'} absolute top-0 right-0 mt-2 mr-2`}></span>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-center mb-4">Your Solana Wallet</h2>
        <div className="flex items-center gap-2 mb-4 text-sm">
          <img src="/electric_bolt.svg" alt="Icon" className="w-4 h-4" />
          <span className="font-semibold">
            {`${walletAddress.substring(0, 4)}...${walletAddress.substr(walletAddress.length - 4)}`}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-4 text-sm">
        <img src="/dollar-white.svg" alt="Icon" className="w-6 h-7" /> 
        <span className="font-semibold">
        {walletAmount} SOL
        </span>
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={sendMoney}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-[##e3e3e3] focus:outline-none focus:bg-[#e3e3e3]">
            <span id="button-text">
        {isLoading ? <div className="spinner" id="spinner"></div> : "Confirm Pay"}
      </span>
          </button>
        </div>
      </div>
    </div>
    
    
    
    
      : 
      <>
      <button
      onClick={connectWallet}
      disabled={isLoading}
      id="submit"
      className="flex justify-center items-center gap-2  border   text-lg font-semibold px-5 py-3   border-[#000044] bg-[#000000] text-white rounded-md w-full"
    >

<img src="/phantom.svg" alt="Icon" className="w-6 h-6" />
      <span id="button-text">
        {isLoading ? <div className="spinner" id="spinner"></div> : "Pay With Solana Wallet"}
      </span>
    </button>
      </>
    }
     {error && <p className='text-red-600 '>{error}</p>}
    </div>
  );
};

export default Checkoutsolana;
