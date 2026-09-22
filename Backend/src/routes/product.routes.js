import { Router } from "express";
import Product from "../models/product.model.js";
import Transaction from "../models/transaction.model.js";
import { asyncRoute, fail, validCount, validMoney } from "../utils/http.js";
const router = Router();
router.get(
  "/",
  asyncRoute(async (req, res) =>
    res.json(await Product.find({ owner: req.owner }).sort({ name: 1 })),
  ),
);
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const {
      name,
      sku,
      category,
      sellingPrice,
      costPrice,
      stock,
      reorderLevel,
    } = req.body;
    if (
      !String(name || "").trim() ||
      !String(sku || "").trim() ||
      !validMoney(sellingPrice) ||
      !validMoney(costPrice) ||
      !validCount(stock) ||
      !validCount(reorderLevel)
    )
      return fail(res, "Enter valid product details");
    if (
      await Product.exists({
        owner: req.owner,
        sku: String(sku).trim().toUpperCase(),
      })
    )
      return fail(res, "SKU already exists", 409);
    const item = await Product.create({
      owner: req.owner,
      name,
      sku,
      category,
      sellingPrice,
      costPrice,
      stock,
      reorderLevel,
    });
    res.status(201).json(item);
  }),
);
router.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const allowed = [
      "name",
      "sku",
      "category",
      "sellingPrice",
      "costPrice",
      "reorderLevel",
    ];
    const changes = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );
    if (
      ("sellingPrice" in changes && !validMoney(changes.sellingPrice)) ||
      ("costPrice" in changes && !validMoney(changes.costPrice)) ||
      ("reorderLevel" in changes && !validCount(changes.reorderLevel))
    )
      return fail(res, "Enter valid product details");
    if ("sku" in changes)
      changes.sku = String(changes.sku).trim().toUpperCase();
    const item = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.owner },
      changes,
      { new: true, runValidators: true },
    );
    if (!item) return fail(res, "Product not found", 404);
    res.json(item);
  }),
);
router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const item = await Product.findOneAndDelete({
      _id: req.params.id,
      owner: req.owner,
    });
    if (!item) return fail(res, "Product not found", 404);
    res.json({ message: "Product deleted successfully" });
  }),
);
router.post(
  "/:id/stock",
  asyncRoute(async (req, res) => {
    const { direction, quantity, note } = req.body;
    if (
      !["in", "out"].includes(direction) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    )
      return fail(res, "Enter a valid stock movement");
    const change = direction === "in" ? quantity : -quantity;
    const item = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.owner,
        ...(change < 0 ? { stock: { $gte: quantity } } : {}),
      },
      { $inc: { stock: change } },
      { new: true },
    );
    if (!item) return fail(res, "Product not found or insufficient stock", 409);
    try {
      await Transaction.create({
        owner: req.owner,
        type: "stock",
        product: item._id,
        amount: change,
        note,
      });
    } catch (error) {
      await Product.updateOne(
        { _id: item._id, owner: req.owner },
        { $inc: { stock: -change } },
      );
      throw error;
    }
    res.json(item);
  }),
);
export default router;
