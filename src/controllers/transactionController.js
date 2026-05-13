import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export async function listTransactions(req, res) {
  const { page = 1, limit = 50, category, type } = req.query;
  const filter = { $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] };
  if (category) filter.category = category;
  if (type)     filter.type     = type;

  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  const userIds = [...new Set([
    ...transactions.map(t => t.senderId?.toString()),
    ...transactions.map(t => t.receiverId?.toString()),
  ].filter(Boolean))];

  const users = await User.find({ _id: { $in: userIds } }, 'fullName username');
  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

  const enriched = transactions.map(tx => {
    const sender   = userMap[tx.senderId?.toString()];
    const receiver = userMap[tx.receiverId?.toString()];
    const isMe     = String(req.user._id);

    let counterparty = null;
    if (tx.type === 'debit' && receiver && String(tx.receiverId) !== isMe) {
      counterparty = { fullName: receiver.fullName, username: receiver.username };
    } else if (tx.type === 'credit' && sender && String(tx.senderId) !== isMe) {
      counterparty = { fullName: sender.fullName, username: sender.username };
    }

    return {
      id:          tx._id,
      amount:      tx.amount,
      type:        tx.type,
      category:    tx.category,
      status:      tx.status,
      description: tx.description,
      created_at:  tx.createdAt,
      sender:      sender   ? { fullName: sender.fullName,   username: sender.username }   : null,
      receiver:    receiver ? { fullName: receiver.fullName, username: receiver.username } : null,
      counterparty,
    };
  });

  res.json({ transactions: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}
