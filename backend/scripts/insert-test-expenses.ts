import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { Expense, ExpenseCategory } from "../src/entities/expense.entity";
import { User } from "../src/entities/user.entity";

// Sample data for generating varied expenses
const descriptions = [
  "Achat carburant pour véhicules",
  "Réparation moteur véhicule",
  "Fournitures de bureau",
  "Paiement loyer mensuel",
  "Salaires du personnel",
  "Frais de communication",
  "Assurance véhicule",
  "Maintenance préventive",
  "Achat matériel informatique",
  "Frais de transport",
  "Impôts et taxes",
  "Publicité et marketing",
  "Frais généraux",
  "Dépense urgente",
  "Approvisionnement bureau",
];

async function generateTestExpenses() {
  try {
    console.log("🚀 Starting test expense generation...");

    // Initialize database
    await initializeDatabase();
    console.log("✅ Database connected");

    // Get repositories
    const expenseRepo = AppDataSource.getRepository(Expense);
    const userRepo = AppDataSource.getRepository(User);

    // Find users by username (try different variations)
    const usernames = [
      "superviseur@transcam.cm",
      "superviseur",
      "comptable@transcam.cm",
      "comptable",
      "compatable@transcam.cm",
      "compatable",
      "staff1@transcam.cm",
      "staff1",
    ];

    const usersToFind = [
      "superviseur@transcam.cm",
      "comptable@transcam.cm",
      "staff1@transcam.cm",
    ];

    const users: User[] = [];

    for (const usernameToFind of usersToFind) {
      // Try exact match first
      let user = await userRepo.findOne({
        where: { username: usernameToFind },
      });

      // If not found, try without @transcam.cm
      if (!user && usernameToFind.includes("@")) {
        const shortUsername = usernameToFind.split("@")[0];
        user = await userRepo.findOne({
          where: { username: shortUsername },
        });
      }

      // If still not found, try with different variations
      if (!user) {
        for (const username of usernames) {
          user = await userRepo.findOne({
            where: { username: username },
          });
          if (user) break;
        }
      }

      if (user) {
        users.push(user);
        console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
      } else {
        console.log(`⚠️  User not found: ${usernameToFind}`);
      }
    }

    if (users.length === 0) {
      console.error("❌ No users found! Please ensure the users exist in the database.");
      console.log("💡 Tip: Users should have usernames matching one of these:");
      console.log("   - superviseur@transcam.cm or superviseur");
      console.log("   - comptable@transcam.cm or comptable");
      console.log("   - staff1@transcam.cm or staff1");
      process.exit(1);
    }

    // All available categories
    const categories = Object.values(ExpenseCategory);

    // Generate 10 expenses
    const expenses = [];
    const expenseCount = 10;

    console.log(`\n💰 Generating ${expenseCount} test expenses...`);

    // Distribute expenses among users
    for (let i = 0; i < expenseCount; i++) {
      // Select user (rotate through available users)
      const user = users[i % users.length];

      // Random data selection
      const description =
        descriptions[Math.floor(Math.random() * descriptions.length)];
      const category =
        categories[Math.floor(Math.random() * categories.length)];

      // Generate varied amounts (1000 to 500000 FCFA)
      const amount = parseFloat((Math.random() * 499000 + 1000).toFixed(2));

      // Create expense with random date in the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const expenseDate = new Date();
      expenseDate.setDate(expenseDate.getDate() - daysAgo);
      expenseDate.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        0,
        0
      );

      // Create expense
      const expense = expenseRepo.create({
        description: description,
        amount: amount,
        category: category,
        created_by: user,
        created_by_id: user.id,
        created_at: expenseDate,
        updated_at: expenseDate,
      });

      expenses.push(expense);
    }

    // Save all expenses
    console.log("💾 Saving expenses to database...");
    const savedExpenses = await expenseRepo.save(expenses);

    console.log(`\n✅ Successfully created ${savedExpenses.length} expenses!`);
    console.log("\n📊 Summary:");

    // Count by user (using user IDs from saved expenses)
    const expensesByUser: { [key: string]: number } = {};
    const userMap = new Map(users.map((u) => [u.id, u.username]));
    savedExpenses.forEach((expense: Expense) => {
      const username = userMap.get(expense.created_by_id) || "Unknown";
      expensesByUser[username] = (expensesByUser[username] || 0) + 1;
    });

    console.log("\n📋 Expenses by user:");
    Object.entries(expensesByUser).forEach(([username, count]) => {
      console.log(`   - ${username}: ${count} expense(s)`);
    });

    // Count by category
    const expensesByCategory: { [key: string]: number } = {};
    savedExpenses.forEach((expense: Expense) => {
      expensesByCategory[expense.category] =
        (expensesByCategory[expense.category] || 0) + 1;
    });

    console.log("\n📋 Expenses by category:");
    Object.entries(expensesByCategory).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} expense(s)`);
    });

    // Reload expenses with relations to display properly
    const expenseIds = savedExpenses.map((e) => e.id);
    const expensesWithRelations = await expenseRepo
      .createQueryBuilder("expense")
      .leftJoinAndSelect("expense.created_by", "created_by")
      .where("expense.id IN (:...ids)", { ids: expenseIds })
      .getMany();

    // Show sample of created expenses
    console.log("\n📋 Sample expenses (first 5):");
    expensesWithRelations.slice(0, 5).forEach((expense: Expense, index: number) => {
      console.log(
        `   ${index + 1}. [${expense.category}] ${expense.description}`
      );
      console.log(
        `      Amount: ${expense.amount} FCFA | Created by: ${
          expense.created_by?.username || "Unknown"
        } | Date: ${new Date(expense.created_at).toLocaleDateString()}`
      );
    });

    // Calculate total
    const totalAmount = savedExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    );
    console.log(`\n💰 Total amount: ${totalAmount.toLocaleString()} FCFA`);

    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error generating test expenses:", error);
    process.exit(1);
  }
}

// Run the script
generateTestExpenses();

