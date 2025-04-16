import { 
  users, 
  type User, 
  type InsertUser, 
  orders, 
  type Order, 
  type InsertOrder,
  serverConfig,
  type ServerConfig,
  type InsertServerConfig
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(discordUserId: string): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Server configuration methods
  getServerConfig(guildId: string): Promise<ServerConfig | undefined>;
  createOrUpdateServerConfig(config: InsertServerConfig): Promise<ServerConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private orders: Map<number, Order>;
  private configs: Map<string, ServerConfig>;
  currentUserId: number;
  currentOrderId: number;
  currentConfigId: number;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.configs = new Map();
    this.currentUserId = 1;
    this.currentOrderId = 1;
    this.currentConfigId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id, 
      status: "pending", 
      createdAt: now 
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUser(discordUserId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.discordUserId === discordUserId
    );
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getServerConfig(guildId: string): Promise<ServerConfig | undefined> {
    return this.configs.get(guildId);
  }

  async createOrUpdateServerConfig(insertConfig: InsertServerConfig): Promise<ServerConfig> {
    const existingConfig = await this.getServerConfig(insertConfig.guildId);
    
    if (existingConfig) {
      const updatedConfig: ServerConfig = { 
        ...existingConfig,
        orderChannelId: insertConfig.orderChannelId ?? existingConfig.orderChannelId,
        requiredRoleId: insertConfig.requiredRoleId ?? existingConfig.requiredRoleId
      };
      this.configs.set(insertConfig.guildId, updatedConfig);
      return updatedConfig;
    }
    
    const id = this.currentConfigId++;
    const config: ServerConfig = { ...insertConfig, id };
    this.configs.set(insertConfig.guildId, config);
    return config;
  }
}

export const storage = new MemStorage();
