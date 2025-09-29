import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { dbConnection } from '../database';

describe('Database Connection', () => {
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;

  beforeEach(async () => {
    // Disconnect any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Create new in-memory MongoDB instance for each test
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  });

  afterEach(async () => {
    // Clean up after each test
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Connection Management', () => {
    it('should connect to MongoDB successfully', async () => {
      expect(dbConnection.getConnectionStatus()).toBe(false);
      
      await dbConnection.connect(mongoUri);
      
      expect(dbConnection.getConnectionStatus()).toBe(true);
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should not connect twice if already connected', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await dbConnection.connect(mongoUri);
      await dbConnection.connect(mongoUri); // Second call
      
      expect(consoleSpy).toHaveBeenCalledWith('Database already connected');
      consoleSpy.mockRestore();
    });

    it('should disconnect successfully', async () => {
      await dbConnection.connect(mongoUri);
      expect(dbConnection.getConnectionStatus()).toBe(true);
      
      await dbConnection.disconnect();
      expect(dbConnection.getConnectionStatus()).toBe(false);
    });

    it('should handle disconnect when not connected', async () => {
      expect(dbConnection.getConnectionStatus()).toBe(false);
      
      // Should not throw error
      await expect(dbConnection.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when MongoDB URI is not provided', async () => {
      // Clear environment variable
      const originalUri = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;
      
      await expect(dbConnection.connect()).rejects.toThrow(
        'MongoDB URI is not provided. Please set MONGODB_URI environment variable.'
      );
      
      // Restore environment variable
      if (originalUri) {
        process.env.MONGODB_URI = originalUri;
      }
    });

    it('should throw error when connection fails', async () => {
      const invalidUri = 'mongodb://invalid-host:27017/test';
      
      await expect(dbConnection.connect(invalidUri, { 
        serverSelectionTimeoutMS: 1000,
        connectTimeoutMS: 1000 
      })).rejects.toThrow();
      expect(dbConnection.getConnectionStatus()).toBe(false);
    }, 10000);

    it('should handle connection errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await dbConnection.connect(mongoUri);
      
      // Simulate connection error
      mongoose.connection.emit('error', new Error('Connection lost'));
      
      expect(dbConnection.getConnectionStatus()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('MongoDB connection error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    }, 10000);
  });

  describe('Connection Events', () => {
    it('should handle disconnection events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await dbConnection.connect(mongoUri);
      
      // Simulate disconnection
      mongoose.connection.emit('disconnected');
      
      expect(dbConnection.getConnectionStatus()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('MongoDB disconnected');
      
      consoleSpy.mockRestore();
    });

    it('should handle reconnection events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await dbConnection.connect(mongoUri);
      
      // Simulate disconnection then reconnection
      mongoose.connection.emit('disconnected');
      expect(dbConnection.getConnectionStatus()).toBe(false);
      
      mongoose.connection.emit('reconnected');
      expect(dbConnection.getConnectionStatus()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('MongoDB reconnected');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = dbConnection;
      const instance2 = dbConnection;
      
      expect(instance1).toBe(instance2);
    });

    it('should provide access to mongoose connection', async () => {
      await dbConnection.connect(mongoUri);
      
      const connection = dbConnection.getConnection();
      expect(connection).toBe(mongoose.connection);
    });
  });

  describe('Connection Options', () => {
    it('should accept custom connection options', async () => {
      const options = {
        bufferCommands: true,
        maxPoolSize: 5
      };
      
      await dbConnection.connect(mongoUri, options);
      expect(dbConnection.getConnectionStatus()).toBe(true);
    });

    it('should use default options when none provided', async () => {
      await dbConnection.connect(mongoUri);
      expect(dbConnection.getConnectionStatus()).toBe(true);
    });
  });
});