import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const deleteTransaction = getRepository(Transaction);

    const transaction = await deleteTransaction.findOne({ where: { id } });
    if (!transaction) {
      throw new AppError('Transaction not found.', 400);
    }

    await deleteTransaction.delete({ id });
  }
}

export default DeleteTransactionService;
