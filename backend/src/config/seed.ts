/**
 * MongoDB Seed Script
 * Populates MongoDB with sample data for testing
 */

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './database';
import {
  MenuItemDocumentModel,
  UserDocumentModel
} from '../db/models';
import { MenuCategory, UserRole } from '../interfaces';

dotenv.config();

const seedDatabase = async (): Promise<void> => {
  try {
    await connectDatabase();

    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const studentPassword = await bcrypt.hash('student123', saltRounds);

    await UserDocumentModel.updateOne(
      { email: 'admin@smartcanteen.com' },
      {
        $setOnInsert: {
          name: 'Admin User',
          email: 'admin@smartcanteen.com',
          password: adminPassword,
          role: UserRole.ADMIN
        }
      },
      { upsert: true }
    );

    const students = [
      { name: 'John Doe', email: 'john@student.edu' },
      { name: 'Jane Smith', email: 'jane@student.edu' },
      { name: 'Bob Wilson', email: 'bob@student.edu' }
    ];

    for (const student of students) {
      await UserDocumentModel.updateOne(
        { email: student.email },
        {
          $setOnInsert: {
            name: student.name,
            email: student.email,
            password: studentPassword,
            role: UserRole.STUDENT
          }
        },
        { upsert: true }
      );
    }

    const menuItems = [
      { name: 'Samosa', description: 'Crispy fried pastry with spiced potato filling', price: 15.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'Vada Pav', description: 'Mumbai style potato fritter in bun', price: 20.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'Pav Bhaji', description: 'Buttery bread with spiced vegetable mash', price: 50.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'Sandwich', description: 'Fresh vegetable sandwich with chutney', price: 35.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'French Fries', description: 'Crispy golden potato fries', price: 40.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'Spring Roll', description: 'Crispy roll with vegetable filling', price: 30.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'Bhel Puri', description: 'Tangy puffed rice snack', price: 25.0, category: MenuCategory.SNACKS, isAvailable: true },
      { name: 'Tea', description: 'Hot masala chai', price: 10.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Coffee', description: 'Hot filter coffee', price: 15.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Cold Coffee', description: 'Chilled coffee with ice cream', price: 45.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Lassi', description: 'Sweet yogurt drink', price: 30.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Mango Shake', description: 'Fresh mango milkshake', price: 50.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Lemonade', description: 'Fresh lime soda', price: 20.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Buttermilk', description: 'Spiced chilled buttermilk', price: 15.0, category: MenuCategory.DRINKS, isAvailable: true },
      { name: 'Thali', description: 'Complete meal with rice, dal, sabzi, roti', price: 80.0, category: MenuCategory.MEALS, isAvailable: true },
      { name: 'Biryani', description: 'Aromatic rice with vegetables/paneer', price: 90.0, category: MenuCategory.MEALS, isAvailable: true },
      { name: 'Fried Rice', description: 'Indo-Chinese style fried rice', price: 60.0, category: MenuCategory.MEALS, isAvailable: true },
      { name: 'Noodles', description: 'Hakka style vegetable noodles', price: 55.0, category: MenuCategory.MEALS, isAvailable: true },
      { name: 'Chole Bhature', description: 'Spiced chickpeas with fried bread', price: 70.0, category: MenuCategory.MEALS, isAvailable: true },
      { name: 'Rajma Chawal', description: 'Kidney beans curry with rice', price: 65.0, category: MenuCategory.MEALS, isAvailable: true },
      { name: 'Paratha', description: 'Stuffed flatbread with curd', price: 45.0, category: MenuCategory.MEALS, isAvailable: false },
      { name: 'Dosa', description: 'Crispy rice crepe with sambhar', price: 55.0, category: MenuCategory.MEALS, isAvailable: true }
    ];

    for (const item of menuItems) {
      await MenuItemDocumentModel.updateOne(
        { name: item.name, category: item.category },
        { $setOnInsert: item },
        { upsert: true }
      );
    }

    console.log('MongoDB seeded successfully');
    console.log('Sample Login Credentials:');
    console.log('Admin: admin@smartcanteen.com / admin123');
    console.log('Student: john@student.edu / student123');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
};

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
