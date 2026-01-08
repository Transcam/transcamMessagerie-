import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Expense, ExpenseCategory } from "../entities/expense.entity";
import { User } from "../entities/user.entity";
import { AuditLog } from "../entities/audit-log.entity";
import { UserRole } from "../types/roles";

export interface CreateExpenseDTO {
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export interface UpdateExpenseDTO {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
}

export interface ExpenseFiltersDTO {
  category?: ExpenseCategory;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface ExpenseStatisticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
}

export class ExpenseService {
  private expenseRepo: Repository<Expense>;
  private auditRepo: Repository<AuditLog>;

  constructor() {
    this.expenseRepo = AppDataSource.getRepository(Expense);
    this.auditRepo = AppDataSource.getRepository(AuditLog);
  }

  async create(data: CreateExpenseDTO, user: User): Promise<Expense> {
    if (!data.description || data.description.trim() === "") {
      throw new Error("Description is required");
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!data.category) {
      throw new Error("Category is required");
    }

    const expense = this.expenseRepo.create({
      ...data,
      created_by: user,
      created_by_id: user.id,
    });

    const saved = await this.expenseRepo.save(expense);
    await this.logAction("create", saved.id, user, null, saved);

    return saved;
  }

  async list(
    filters: ExpenseFiltersDTO,
    user: User
  ): Promise<[Expense[], number]> {
    const query = this.expenseRepo
      .createQueryBuilder("expense")
      .leftJoinAndSelect("expense.created_by", "created_by")
      .leftJoinAndSelect("expense.updated_by", "updated_by");

    // STAFF can only see their own expenses
    if (user.role === UserRole.STAFF) {
      query.andWhere("expense.created_by_id = :userId", {
        userId: user.id,
      });
    }

    if (filters.category) {
      query.andWhere("expense.category = :category", {
        category: filters.category,
      });
    }

    if (filters.dateFrom) {
      query.andWhere("expense.created_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere("expense.created_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy("expense.created_at", "DESC");

    const [expenses, total] = await query.getManyAndCount();

    // STAFF can see amounts of their own expenses only (already filtered above)
    // No need to mask since they only see their own expenses

    return [expenses, total];
  }

  async getOne(id: number, user: User): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      relations: ["created_by", "updated_by"],
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    // STAFF can only see their own expenses
    if (user.role === UserRole.STAFF && expense.created_by_id !== user.id) {
      throw new Error("Expense not found");
    }

    // STAFF can see amount of their own expense (already verified above)
    // No need to mask since they only see their own expenses

    return expense;
  }

  async update(
    id: number,
    data: UpdateExpenseDTO,
    user: User
  ): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    // STAFF cannot update expenses (authorization handled at route level)
    // Additional check here as safety measure
    if (user.role === UserRole.STAFF) {
      throw new Error("Staff members cannot modify expenses");
    }

    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const oldValues = { ...expense };
    Object.assign(expense, data);
    expense.updated_by = user;
    expense.updated_by_id = user.id;

    const saved = await this.expenseRepo.save(expense);
    await this.logAction("update", saved.id, user, oldValues, saved);

    return saved;
  }

  async delete(id: number, user: User): Promise<void> {
    const expense = await this.expenseRepo.findOne({
      where: { id },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    await this.logAction("delete", expense.id, user, expense, null);
    await this.expenseRepo.remove(expense);
  }

  async getStatistics(
    filters: ExpenseStatisticsFilters,
    user: User
  ): Promise<{
    total: number;
    totalAmount: number | null;
    byCategory: { [key: string]: number };
    todayCount: number;
    todayAmount: number | null;
    monthCount: number;
    monthAmount: number | null;
    averageAmount: number | null;
  }> {
    const query = this.expenseRepo.createQueryBuilder("expense");

    // STAFF can only see statistics for their own expenses
    if (user.role === UserRole.STAFF) {
      query.andWhere("expense.created_by_id = :userId", {
        userId: user.id,
      });
    }

    if (filters.dateFrom) {
      query.andWhere("expense.created_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere("expense.created_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    const expenses = await query.getMany();

    const total = expenses.length;
    const totalAmount = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    );

    // Group by category
    const byCategory: { [key: string]: number } = {};
    expenses.forEach((e) => {
      const category = e.category;
      const amount = parseFloat(e.amount.toString());
      byCategory[category] = (byCategory[category] || 0) + amount;
    });

    // Calculate today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayExpenses = expenses.filter((e) => {
      const createdDate = new Date(e.created_at);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    });
    const todayCount = todayExpenses.length;
    const todayAmount = todayExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    );

    // Calculate month's statistics
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthExpenses = expenses.filter((e) => {
      const createdDate = new Date(e.created_at);
      return createdDate >= monthStart;
    });
    const monthCount = monthExpenses.length;
    const monthAmount = monthExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    );

    // Calculate average
    const averageAmount = total > 0 ? totalAmount / total : 0;

    // STAFF can see statistics of their own expenses only (already filtered above)
    // Return all statistics including amounts since they only see their own expenses
    return {
      total,
      totalAmount,
      byCategory,
      todayCount,
      todayAmount,
      monthCount,
      monthAmount,
      averageAmount,
    };
  }

  private async logAction(
    action: string,
    entityId: number,
    user: User,
    oldValues: any,
    newValues: any,
    reason?: string
  ): Promise<void> {
    const log = this.auditRepo.create({
      entity_type: "expense",
      entity_id: entityId,
      action,
      old_values: oldValues,
      new_values: newValues,
      user,
      user_id: user.id,
      reason,
    });

    await this.auditRepo.save(log);
  }
}

