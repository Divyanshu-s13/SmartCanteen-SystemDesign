/**
 * Database Seed Script
 * Populates database with sample data for testing
 */

import { pool } from './database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Hash passwords
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const studentPassword = await bcrypt.hash('student123', saltRounds);

    // Insert admin user
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@smartcanteen.com', adminPassword, 'admin']);

    // Insert sample students
    const students = [
      ['John Doe', 'john@student.edu', studentPassword, 'student'],
      ['Jane Smith', 'jane@student.edu', studentPassword, 'student'],
      ['Bob Wilson', 'bob@student.edu', studentPassword, 'student'],
    ];

    for (const student of students) {
      await client.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, student);
    }

    // Insert menu items
    const menuItems = [
      // Snacks
      ['Samosa', 'Crispy fried pastry with spiced potato filling', 15.00, 'snacks', true],
      ['Vada Pav', 'Mumbai style potato fritter in bun', 20.00, 'snacks', true],
      ['Pav Bhaji', 'Buttery bread with spiced vegetable mash', 50.00, 'snacks', true],
      ['Sandwich', 'Fresh vegetable sandwich with chutney', 35.00, 'snacks', true],
      ['French Fries', 'Crispy golden potato fries', 40.00, 'snacks', true],
      ['Spring Roll', 'Crispy roll with vegetable filling', 30.00, 'snacks', true],
      ['Bhel Puri', 'Tangy puffed rice snack', 25.00, 'snacks', true],

      // Drinks
      ['Tea', 'Hot masala chai', 10.00, 'drinks', true],
      ['Coffee', 'Hot filter coffee', 15.00, 'drinks', true],
      ['Cold Coffee', 'Chilled coffee with ice cream', 45.00, 'drinks', true],
      ['Lassi', 'Sweet yogurt drink', 30.00, 'drinks', true],
      ['Mango Shake', 'Fresh mango milkshake', 50.00, 'drinks', true],
      ['Lemonade', 'Fresh lime soda', 20.00, 'drinks', true],
      ['Buttermilk', 'Spiced chilled buttermilk', 15.00, 'drinks', true],

      // Meals
      ['Thali', 'Complete meal with rice, dal, sabzi, roti', 80.00, 'meals', true],
      ['Biryani', 'Aromatic rice with vegetables/paneer', 90.00, 'meals', true],
      ['Fried Rice', 'Indo-Chinese style fried rice', 60.00, 'meals', true],
      ['Noodles', 'Hakka style vegetable noodles', 55.00, 'meals', true],
      ['Chole Bhature', 'Spiced chickpeas with fried bread', 70.00, 'meals', true],
      ['Rajma Chawal', 'Kidney beans curry with rice', 65.00, 'meals', true],
      ['Paratha', 'Stuffed flatbread with curd', 45.00, 'meals', false], // Unavailable
      ['Dosa', 'Crispy rice crepe with sambhar', 55.00, 'meals', true],
    ];

    for (const item of menuItems) {
      await client.query(`
        INSERT INTO menu_items (name, description, price, category, is_available)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, item);
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    console.log('');
    console.log('Sample Login Credentials:');
    console.log('-------------------------');
    console.log('Admin: admin@smartcanteen.com / admin123');
    console.log('Student: john@student.edu / student123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed
seedDatabase()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  });
