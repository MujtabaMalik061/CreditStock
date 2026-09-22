import { Router } from "express";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";
import Transaction from "../models/transaction.model.js";
import { customerBalance } from "../services/credit.service.js";
import { asyncRoute, fail, validMoney } from "../utils/http.js";
const router = Router();
router.get(
  "/",
  asyncRoute(async (req, res) =>
    res.json(
      await Transaction.find({ owner: req.owner })
        .populate("product", "name sku")
        .populate("customer", "name phone")
        .sort({ createdAt: -1 })
        .limit(100),
    ),
  ),
);
router.post(
  "/sales",
  asyncRoute(async (req, res) => {
    const { productId, customerId, quantity, paid } = req.body;
    if (!Number.isInteger(quantity) || quantity < 1 || !validMoney(paid))
      return fail(res, "Enter a valid sale");
    const original = await Product.findOne({
      _id: productId,
      owner: req.owner,
    });
    if (!original) return fail(res, "Product not found", 404);
    const total = Math.round(original.sellingPrice * quantity * 100) / 100;
    if (paid > total) return fail(res, "Payment cannot exceed sale total");
    if (paid < total && !customerId)
      return fail(res, "Select a customer for a credit sale");
    if (
      customerId &&
      !(await Customer.exists({ _id: customerId, owner: req.owner }))
    )
      return fail(res, "Customer not found", 404);
    const item = await Product.findOneAndUpdate(
      { _id: productId, owner: req.owner, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true },
    );
    if (!item) return fail(res, "Insufficient stock", 409);
    try {
      const sale = await Transaction.create({
        owner: req.owner,
        type: "sale",
        product: productId,
        customer: customerId || null,
        quantity,
        total,
        paid,
        unitCost: original.costPrice,
      });
      res.status(201).json(sale);
    } catch (error) {
      await Product.updateOne(
        { _id: productId, owner: req.owner },
        { $inc: { stock: quantity } },
      );
      throw error;
    }
  }),
);
router.post(
  "/payments",
  asyncRoute(async (req, res) => {
    const { customerId, amount } = req.body;
    if (!validMoney(amount) || amount <= 0)
      return fail(res, "Enter a valid payment amount");
    if (!(await Customer.exists({ _id: customerId, owner: req.owner })))
      return fail(res, "Customer not found", 404);
    const balance = await customerBalance(customerId, req.owner);
    if (amount > balance)
      return fail(res, "Payment exceeds outstanding balance");
    res
      .status(201)
      .json(
        await Transaction.create({
          owner: req.owner,
          type: "payment",
          customer: customerId,
          amount,
        }),
      );
  }),
);
export default router;
