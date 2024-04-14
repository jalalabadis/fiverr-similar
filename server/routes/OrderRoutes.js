import { Router } from "express";

import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { delayMiddleware } from "../middlewares/delayMiddleware.js";
import {
  confirmOrder,
  confirmSolanaOrder,
  createOrder,
  getBuyerOrders,
  getSellerOrders,
} from "../controllers/OrdersControllers.js";


export const orderRoutes = Router();

orderRoutes.post("/create", verifyToken, createOrder);
orderRoutes.put("/success", verifyToken, confirmOrder);
orderRoutes.post("/solana-success", verifyToken, delayMiddleware, confirmSolanaOrder);
orderRoutes.get("/get-buyer-orders", verifyToken, getBuyerOrders);
orderRoutes.get("/get-seller-orders", verifyToken, getSellerOrders);
