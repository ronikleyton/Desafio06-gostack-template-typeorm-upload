import path from 'path';
import fs from 'fs';
import CSV from 'csv-parse';
import { getRepository, In } from 'typeorm';
import uploadConfig from '../config/upload';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  file: string;
}

interface DTOcategories {
  title: string;
}

interface CSVtransation {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, file);
    const openReadCSV = fs.createReadStream(csvFilePath);
    const parsers = CSV({
      from_line: 2,
    });
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);
    const parsersCSV = openReadCSV.pipe(parsers);
    const categories: string[] = [];
    const transactions: CSVtransation[] = [];

    parsersCSV.on('data', row => {
      if (
        row[0] !== 'title' &&
        row[1] !== 'type' &&
        row[2] !== 'value' &&
        row[3] !== 'category'
      ) {
        categories.push(row[3].trim());
        transactions.push({
          title: row[0],
          type: row[1].trim(),
          value: row[2].trim(),
          category: row[3].trim(),
        });
      }
    });

    await new Promise(resolve => parsersCSV.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where: In(categories),
    });
    const existentCategoriesTitles = existentCategories.map(
      (category: DTOcategories) => category.title,
    );

    // console.log(existentCategoriesTitles);
    const categories_add = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      categories_add.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const allCategories = [...newCategories, ...existentCategories];
    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
