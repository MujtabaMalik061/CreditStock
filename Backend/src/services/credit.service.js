import Transaction from "../models/transaction.model.js";
export async function balances(owner) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        owner,
        customer: { $ne: null },
        type: { $in: ["sale", "payment"] },
      },
    },
    {
      $group: {
        _id: "$customer",
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$type", "sale"] },
              { $subtract: ["$total", "$paid"] },
              { $multiply: ["$amount", -1] },
            ],
          },
        },
      },
    },
  ]);
  return Object.fromEntries(
    rows.map((row) => [String(row._id), Math.round(row.balance * 100) / 100]),
  );
}
export async function customerBalance(id, owner) {
  return (await balances(owner))[String(id)] || 0;
}
