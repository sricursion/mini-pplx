import mongoose from 'mongoose';

interface ConnectionOptions {
  bufferCommands?: boolean;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  connectTimeoutMS?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(uri?: string, options?: ConnectionOptions): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    try {
      const mongoUri = uri || process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MongoDB URI is not provided. Please set MONGODB_URI environment variable.');
      }

      const defaultOptions: ConnectionOptions = {
        bufferCommands: false,
        maxPoolSize: 10,
        ...options
      };

      await mongoose.connect(mongoUri, defaultOptions);
      
      this.isConnected = true;
      console.log('Successfully connected to MongoDB');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }
}

export const dbConnection = DatabaseConnection.getInstance();

// Convenience function for connecting to database
export async function connectToDatabase(): Promise<void> {
  return dbConnection.connect();
}

export default dbConnection;