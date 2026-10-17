import prisma from '../lib/prisma.js';

function money(n) {
  return Math.round(Number(n) * 100) / 100;
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    balance: user.balance,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
  };
}

async function addTx(tx, { userId, type, amount, balanceAfter, note, counterparty }) {
  return tx.transaction.create({
    data: {
      userId,
      type,
      amount,
      balanceAfter,
      note: note || null,
      counterparty: counterparty || null,
    },
  });
}

export async function getBalance(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  return res.json({
    balance: user.balance,
    currency: 'BDT',
    user: publicUser(user),
  });
}

export async function addMoney(req, res) {
  try {
    const amount = money(req.body.amount);
    const note = req.body.note?.trim() || 'Cash / card deposit';

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Enter a valid amount greater than 0.' });
    }
    if (amount > 1000000) {
      return res.status(400).json({ message: 'Maximum add money per request is 1,000,000 BDT.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.user.id },
        data: { balance: { increment: amount } },
      });
      await addTx(tx, {
        userId: user.id,
        type: 'ADD_MONEY',
        amount,
        balanceAfter: user.balance,
        note,
      });
      return user;
    });

    return res.json({
      message: `Added ${amount.toFixed(2)} BDT successfully.`,
      balance: updated.balance,
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('addMoney error', error);
    return res.status(500).json({ message: 'Could not add money.' });
  }
}

export async function fundTransfer(req, res) {
  try {
    const amount = money(req.body.amount);
    const toEmail = req.body.toEmail?.toLowerCase().trim();
    const note = req.body.note?.trim() || 'Fund transfer';

    if (!toEmail) {
      return res.status(400).json({ message: 'Recipient email is required.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Enter a valid transfer amount.' });
    }
    if (toEmail === req.user.email) {
      return res.status(400).json({ message: 'You cannot transfer money to yourself.' });
    }

    const recipient = await prisma.user.findUnique({ where: { email: toEmail } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient account not found.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({ where: { id: req.user.id } });
      if (sender.balance < amount) {
        const err = new Error('INSUFFICIENT');
        throw err;
      }

      const updatedSender = await tx.user.update({
        where: { id: sender.id },
        data: { balance: { decrement: amount } },
      });
      const updatedRecipient = await tx.user.update({
        where: { id: recipient.id },
        data: { balance: { increment: amount } },
      });

      await addTx(tx, {
        userId: sender.id,
        type: 'TRANSFER_OUT',
        amount: -amount,
        balanceAfter: updatedSender.balance,
        note,
        counterparty: recipient.email,
      });
      await addTx(tx, {
        userId: recipient.id,
        type: 'TRANSFER_IN',
        amount,
        balanceAfter: updatedRecipient.balance,
        note,
        counterparty: sender.email,
      });

      return updatedSender;
    });

    return res.json({
      message: `Transferred ${amount.toFixed(2)} BDT to ${toEmail}.`,
      balance: result.balance,
      user: publicUser(result),
    });
  } catch (error) {
    if (error.message === 'INSUFFICIENT') {
      return res.status(400).json({ message: 'Insufficient balance for this transfer.' });
    }
    console.error('fundTransfer error', error);
    return res.status(500).json({ message: 'Transfer failed.' });
  }
}

export async function billPayment(req, res) {
  try {
    const amount = money(req.body.amount);
    const billType = req.body.billType?.trim();
    const accountNo = req.body.accountNo?.trim();
    const allowed = ['Electricity', 'Gas', 'Water', 'Internet', 'Mobile Recharge'];

    if (!allowed.includes(billType)) {
      return res.status(400).json({
        message: `Select a valid bill type: ${allowed.join(', ')}.`,
      });
    }
    if (!accountNo) {
      return res.status(400).json({ message: 'Bill / account number is required.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Enter a valid bill amount.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.user.id } });
      if (user.balance < amount) {
        throw new Error('INSUFFICIENT');
      }
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      });
      await addTx(tx, {
        userId: user.id,
        type: 'BILL_PAYMENT',
        amount: -amount,
        balanceAfter: updated.balance,
        note: `${billType} bill`,
        counterparty: accountNo,
      });
      return updated;
    });

    return res.json({
      message: `Paid ${amount.toFixed(2)} BDT for ${billType}.`,
      balance: result.balance,
      user: publicUser(result),
    });
  } catch (error) {
    if (error.message === 'INSUFFICIENT') {
      return res.status(400).json({ message: 'Insufficient balance for this bill payment.' });
    }
    console.error('billPayment error', error);
    return res.status(500).json({ message: 'Bill payment failed.' });
  }
}

export async function listTransactions(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return res.json({ transactions });
}
