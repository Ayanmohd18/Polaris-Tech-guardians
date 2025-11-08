interface DatabaseConfig {
  type: 'supabase' | 'firebase' | 'mongodb' | 'postgresql';
  url: string;
  apiKey?: string;
}

export class DatabaseConnector {
  private connections: Map<string, any> = new Map();

  async connect(config: DatabaseConfig): Promise<any> {
    const key = `${config.type}_${config.url}`;
    
    if (this.connections.has(key)) {
      return this.connections.get(key);
    }

    let connection;
    
    switch (config.type) {
      case 'supabase':
        connection = await this.connectSupabase(config);
        break;
      case 'firebase':
        connection = await this.connectFirebase(config);
        break;
      case 'mongodb':
        connection = await this.connectMongoDB(config);
        break;
      case 'postgresql':
        connection = await this.connectPostgreSQL(config);
        break;
      default:
        throw new Error(`Database type ${config.type} not supported`);
    }

    this.connections.set(key, connection);
    return connection;
  }

  private async connectSupabase(config: DatabaseConfig) {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(config.url, config.apiKey!);
  }

  private async connectFirebase(config: DatabaseConfig) {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    
    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: `${config.url}.firebaseapp.com`,
      projectId: config.url
    });
    return getFirestore(app);
  }

  private async connectMongoDB(config: DatabaseConfig) {
    // Mock MongoDB connection for frontend
    return {
      collection: (name: string) => ({
        find: () => ({ toArray: () => Promise.resolve([]) }),
        insertOne: (doc: any) => Promise.resolve({ insertedId: 'mock' })
      })
    };
  }

  private async connectPostgreSQL(config: DatabaseConfig) {
    // Mock PostgreSQL connection for frontend
    return { query: async (sql: string) => ({ rows: [] }) };
  }

  async query(dbType: string, table: string, operation: 'select' | 'insert' | 'update' | 'delete', data?: any): Promise<any> {
    const connection = Array.from(this.connections.values())[0];
    
    switch (dbType) {
      case 'supabase':
        switch (operation) {
          case 'select': return connection.from(table).select();
          case 'insert': return connection.from(table).insert(data);
          case 'update': return connection.from(table).update(data);
          case 'delete': return connection.from(table).delete();
        }
        break;
      case 'mongodb':
        switch (operation) {
          case 'select': return connection.collection(table).find().toArray();
          case 'insert': return connection.collection(table).insertOne(data);
        }
        break;
      case 'postgresql':
        return connection.query(`${operation.toUpperCase()} * FROM ${table}`, []);
      default:
        throw new Error(`Query not supported for ${dbType}`);
    }
  }
}