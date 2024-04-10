import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { Connection, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';

const stripe = new Stripe(
  "sk_test_51DpVXWGc9EcLzRLBNKni929hB026lACv6toMfjH1FPtIXfYgIrhXzjolcYzDDl2VwtvmyPF20PJ1JaMUCTNoEwDN00FN8hrRZL"
);
const connection = new Connection('https://api.devnet.solana.com');
const yourSolanaWalletPublicKey = new PublicKey(process.env.SOLANA_PUBKEY);

export const createOrder = async (req, res, next) => {
  try {
    if (req.body.gigId) {
      const { gigId } = req.body;
      const prisma = new PrismaClient();
      const gig = await prisma.gigs.findUnique({
        where: { id: parseInt(gigId) },
      });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: gig?.price * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      await prisma.orders.create({
        data: {
          paymentIntent: paymentIntent.id,
          price: gig?.price,
          buyer: { connect: { id: req?.userId } },
          gig: { connect: { id: gig?.id } },
        },
      });
      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
        gigPrice: gig?.price
      });
    } else {
      res.status(400).send("Gig id is required.");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    if (req.body.paymentIntent) {
      const prisma = new PrismaClient();
      await prisma.orders.update({
        where: { paymentIntent: req.body.paymentIntent },
        data: { isCompleted: true },
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const confirmSolanaOrder = async (req, res, next) => {
  try {
    if (req.body.gigId) {
      const { gigId, signedTransaction } = req.body;

//////Gig Data Load
const prisma = new PrismaClient();
const gig = await prisma.gigs.findUnique({
  where: { id: parseInt(gigId) },
});


/////Verify SOL Transaction
      const transaction = Transaction.from(signedTransaction);
      const isSignatureValid = await transaction.verifySignature();
      if (!isSignatureValid) {
        throw new Error('Invalid signature');
      }
      const recipientPublicKey = transaction.instructions[0].keys[1].pubkey;
      const amount = transaction.instructions[0].data.slice(8, 16).readUIntLE(0, 8);
  
      // Verify the recipient address
      if (!recipientPublicKey.equals(yourSolanaWalletPublicKey)) {
        throw new Error('Invalid recipient');
      }
  
      // Verify the amount
      if (amount !== gig?.price) {
        throw new Error('Invalid amount');
      }
      // Process the transaction
      const signature = await connection.sendRawTransaction(signedTransaction);
    
      await prisma.orders.create({
        data: {
          paymentIntent: signature.toString(),
          price: gig?.price,
          buyer: { connect: { id: req?.userId } },
          gig: { connect: { id: gig?.id } },
          isCompleted: true
        },
      });

      res.status(200).json({ message: 'Transaction received and verified'});
    }
      else {
        res.status(400).send("Gig id is required.");
      }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getBuyerOrders = async (req, res, next) => {
  try {
    if (req.userId) {
      const prisma = new PrismaClient();
      const orders = await prisma.orders.findMany({
        where: { buyerId: req.userId, isCompleted: true },
        include: { gig: true },
      });
      return res.status(200).json({ orders });
    }
    return res.status(400).send("User id is required.");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getSellerOrders = async (req, res, next) => {
  try {
    if (req.userId) {
      const prisma = new PrismaClient();
      const orders = await prisma.orders.findMany({
        where: {
          gig: {
            createdBy: {
              id: parseInt(req.userId),
            },
          },
          isCompleted: true,
        },
        include: {
          gig: true,
          buyer: true,
        },
      });
      return res.status(200).json({ orders });
    }
    return res.status(400).send("User id is required.");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};
