/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { ExpenseService } from "../services/expense.service";
import { ExpenseCategory } from "../entities/expense.entity";
import { UserRole } from "../types/roles";

export class ExpensesController {
  private service: ExpenseService;

  constructor() {
    this.service = new ExpenseService();
  }

  list = async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as ExpenseCategory | undefined,
        dateFrom: req.query.dateFrom
          ? new Date(req.query.dateFrom as string)
          : undefined,
        dateTo: req.query.dateTo
          ? new Date(req.query.dateTo as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [expenses, total] = await this.service.list(filters, req.user);

      // Sanitize amounts for STAFF role (already done in service, but double-check)
      const sanitizedExpenses = expenses.map((expense: any) => {
        if (req.user?.role === UserRole.STAFF) {
          return { ...expense, amount: null };
        }
        return expense;
      });

      res.json({
        data: sanitizedExpenses,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / filters.limit!),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const expense = await this.service.getOne(id, req.user);

      // Sanitize amount for STAFF role (already done in service, but double-check)
      let sanitizedExpense = expense;
      if (req.user.role === UserRole.STAFF) {
        sanitizedExpense = { ...expense, amount: null } as any;
      }

      res.json({ data: sanitizedExpense });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { description, amount, category } = req.body;

      if (!description || description.trim() === "") {
        return res.status(400).json({ error: "Description is required" });
      }

      if (!amount || amount <= 0) {
        return res
          .status(400)
          .json({ error: "Amount is required and must be greater than 0" });
      }

      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Validate category is a valid enum value
      const validCategories = Object.values(ExpenseCategory);
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const expense = await this.service.create(req.body, req.user);
      res.status(201).json({ data: expense });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const { description, amount, category } = req.body;

      // Validate amount if provided
      if (amount !== undefined && amount <= 0) {
        return res
          .status(400)
          .json({ error: "Amount must be greater than 0" });
      }

      // Validate category if provided
      if (category) {
        const validCategories = Object.values(ExpenseCategory);
        if (!validCategories.includes(category)) {
          return res.status(400).json({ error: "Invalid category" });
        }
      }

      const expense = await this.service.update(id, req.body, req.user);
      res.json({ data: expense });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      await this.service.delete(id, req.user);
      res.json({ message: "Expense deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const filters = {
        dateFrom: req.query.dateFrom
          ? new Date(req.query.dateFrom as string)
          : undefined,
        dateTo: req.query.dateTo
          ? new Date(req.query.dateTo as string)
          : undefined,
      };

      const statistics = await this.service.getStatistics(filters, req.user);

      // Sanitize amounts for STAFF role (already done in service, but double-check)
      let sanitizedStatistics = statistics;
      if (req.user.role === UserRole.STAFF) {
        sanitizedStatistics = {
          ...statistics,
          totalAmount: null,
          byCategory: {},
          todayAmount: null,
          monthAmount: null,
          averageAmount: null,
        };
      }

      res.json({ data: sanitizedStatistics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}


