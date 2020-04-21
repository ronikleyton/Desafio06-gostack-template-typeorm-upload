import { getRepository, getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getRepository(Transaction);
    const transactionCustomRepository = getCustomRepository(
      TransactionsRepository,
    );

    const getBalance = await transactionCustomRepository.getBalance();
    if (type === 'outcome') {
      if (getBalance.total - value < 0) {
        throw new AppError('You no have cash to spend!');
      }
    }
    const categoryRepository = getRepository(Category);
    let checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!checkCategoryExists) {
      checkCategoryExists = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(checkCategoryExists);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: checkCategoryExists,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
