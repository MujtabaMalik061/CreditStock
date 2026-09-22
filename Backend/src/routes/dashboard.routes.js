import { Router } from "express";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";
import Transaction from "../models/transaction.model.js";
import { balances } from "../services/credit.service.js";
import { asyncRoute } from "../utils/http.js";
const router = Router();
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - 6);
    const [products, customerCount, due, sales] = await Promise.all([
      Product.find({ owner: req.owner }).sort({ stock: 1 }).lean(),
      Customer.countDocuments({ owner: req.owner }),
      balances(req.owner),
      Transaction.find({
        owner: req.owner,
        type: "sale",
        createdAt: { $gte: weekStart },
      })
        .populate("product", "name costPrice")
        .lean(),
    ]);
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);
      return {
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString("en-PK", { weekday: "short" }),
        sales: 0,
        count: 0,
      };
    });
    let todaySales = 0,
      todaySaleCount = 0,
      weeklySales = 0,
      estimatedProfit = 0;
    for (const sale of sales) {
      const saleDay = new Date(sale.createdAt);
      saleDay.setHours(0, 0, 0, 0);
      const index = Math.round((saleDay - weekStart) / 86400000);
      if (days[index]) {
        days[index].sales += sale.total;
        days[index].count += 1;
      }
      if (saleDay.getTime() === start.getTime()) {
        todaySales += sale.total;
        todaySaleCount += 1;
      }
      weeklySales += sale.total;
      estimatedProfit +=
        sale.total -
        (sale.unitCost ?? sale.product?.costPrice ?? 0) * sale.quantity;
    }
    res.json({
      todaySales,
      todaySaleCount,
      weeklySales,
      estimatedProfit,
      outstandingCredit: Object.values(due).reduce((a, b) => a + b, 0),
      productCount: products.length,
      customerCount,
      inventoryValue: products.reduce((a, p) => a + p.stock * p.costPrice, 0),
      lowStock: products.filter((p) => p.stock <= p.reorderLevel),
      salesTrend: days,
    });
  }),
);
export default router;
