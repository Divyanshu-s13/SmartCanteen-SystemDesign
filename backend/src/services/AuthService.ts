/**
 * Authentication Service
 * Handles user authentication, registration, and JWT token management
 * Follows Single Responsibility Principle (SRP)
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository, UserRepository } from '../repositories';
import { userFactory } from '../patterns';
import {
  IUser,
  ICreateUserDTO,
  ILoginDTO,
  IJWTPayload,
  UserRole,
  IApiResponse
} from '../interfaces';
import { User } from '../models';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private saltRounds: number = 10;

  constructor(userRepo?: UserRepository) {
    // Dependency Injection - allows for testing with mock repository
    this.userRepository = userRepo || userRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Register a new user
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<IApiResponse<{ user: Omit<IUser, 'password'>; token: string }>> {
    try {
      // Validate input
      if (!data.name || !data.email || !data.password) {
        return {
          success: false,
          message: 'Name, email, and password are required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Validate email format
      if (!User.validateEmail(data.email)) {
        return {
          success: false,
          message: 'Invalid email format',
          error: 'VALIDATION_ERROR'
        };
      }

      // Validate password
      const passwordValidation = User.validatePassword(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message || 'Invalid password',
          error: 'VALIDATION_ERROR'
        };
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
          error: 'USER_EXISTS'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

      // Create user
      const createUserDTO: ICreateUserDTO = {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: data.role || UserRole.STUDENT
      };

      const newUser = await this.userRepository.create(createUserDTO);

      // Create user model using factory pattern
      const userModel = userFactory.createUser(newUser);

      // Generate JWT token
      const token = this.generateToken(newUser);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userModel.toJSON() as Omit<IUser, 'password'>,
          token
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: ILoginDTO): Promise<IApiResponse<{ user: Omit<IUser, 'password'>; token: string }>> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          message: 'Email and password are required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        };
      }

      // Create user model using factory pattern
      const userModel = userFactory.createUser(user);

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userModel.toJSON() as Omit<IUser, 'password'>,
          token
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): IJWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as IJWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user profile (without password)
   */
  async getProfile(userId: string): Promise<IApiResponse<Omit<IUser, 'password'>>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'NOT_FOUND'
        };
      }

      const userModel = userFactory.createUser(user);

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: userModel.toJSON() as Omit<IUser, 'password'>
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Failed to retrieve profile',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<IApiResponse<Omit<IUser, 'password'>>> {
    try {
      // Validate email if provided
      if (data.email && !User.validateEmail(data.email)) {
        return {
          success: false,
          message: 'Invalid email format',
          error: 'VALIDATION_ERROR'
        };
      }

      // Check if email is already taken
      if (data.email) {
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser && existingUser.id !== userId) {
          return {
            success: false,
            message: 'Email is already taken',
            error: 'EMAIL_EXISTS'
          };
        }
      }

      const updatedUser = await this.userRepository.update(userId, data);
      if (!updatedUser) {
        return {
          success: false,
          message: 'User not found',
          error: 'NOT_FOUND'
        };
      }

      const userModel = userFactory.createUser(updatedUser);

      return {
        success: true,
        message: 'Profile updated successfully',
        data: userModel.toJSON() as Omit<IUser, 'password'>
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<IApiResponse> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'NOT_FOUND'
        };
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
          error: 'INVALID_PASSWORD'
        };
      }

      // Validate new password
      const passwordValidation = User.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message || 'Invalid new password',
          error: 'VALIDATION_ERROR'
        };
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      await this.userRepository.update(userId, { password: hashedPassword });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: IUser): string {
    const payload: IJWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as jwt.SignOptions);
  }
}

// Export singleton instance
export const authService = new AuthService();
