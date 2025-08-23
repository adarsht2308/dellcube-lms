import { checkAllVehiclesForExpiry } from "./vehicleExpiryChecker.js";

/**
 * Scheduler utility for handling all automated tasks
 * This file manages scheduled tasks like vehicle expiry checks, cleanup jobs, etc.
 */

class Scheduler {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all scheduled tasks
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("Scheduler already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing scheduled tasks...");
      
      // Initialize vehicle expiry checker
      await this.initializeVehicleExpiryChecker();
      
      this.isInitialized = true;
      console.log("✅ All scheduled tasks initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing scheduled tasks:", error);
    }
  }

  /**
   * Initialize vehicle expiry checker tasks
   */
  async initializeVehicleExpiryChecker() {
    try {
      console.log("📋 Setting up vehicle expiry checker...");
      
      // Task 1: Initial check on startup (after 10 seconds)
      const startupTask = setTimeout(async () => {
        try {
          console.log("🔄 Running initial vehicle expiry check on startup...");
          const result = await checkAllVehiclesForExpiry();
          console.log("✅ Startup expiry check result:", result.message);
        } catch (error) {
          console.error("❌ Error in startup vehicle expiry check:", error);
        }
      }, 10000); // Wait 10 seconds after server starts
      
      this.tasks.set('vehicleExpiryStartup', startupTask);
      
      // Task 2: Daily scheduled check (every 24 hours)
      const dailyTask = setInterval(async () => {
        try {
          console.log("🔄 Running scheduled vehicle expiry check...");
          const result = await checkAllVehiclesForExpiry();
          console.log("✅ Scheduled expiry check result:", result.message);
        } catch (error) {
          console.error("❌ Error in scheduled vehicle expiry check:", error);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
      
      this.tasks.set('vehicleExpiryDaily', dailyTask);
      
      console.log("✅ Vehicle expiry checker initialized");
    } catch (error) {
      console.error("❌ Error initializing vehicle expiry checker:", error);
      throw error;
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    console.log("🛑 Stopping all scheduled tasks...");
    
    this.tasks.forEach((task, name) => {
      if (task && typeof task === 'object') {
        if (task.hasOwnProperty('_destroyed')) {
          // Clear timeout
          clearTimeout(task);
        } else {
          // Clear interval
          clearInterval(task);
        }
        console.log(`🛑 Stopped task: ${name}`);
      }
    });
    
    this.tasks.clear();
    this.isInitialized = false;
    console.log("✅ All scheduled tasks stopped");
  }

  /**
   * Stop a specific task
   */
  stopTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      if (task.hasOwnProperty('_destroyed')) {
        clearTimeout(task);
      } else {
        clearInterval(task);
      }
      this.tasks.delete(taskName);
      console.log(`🛑 Stopped task: ${taskName}`);
      return true;
    }
    console.log(`⚠️ Task not found: ${taskName}`);
    return false;
  }

  /**
   * Get status of all tasks
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeTasks: Array.from(this.tasks.keys()),
      totalTasks: this.tasks.size
    };
  }

  /**
   * Manually trigger vehicle expiry check
   */
  async triggerVehicleExpiryCheck() {
    try {
      console.log("🔄 Manually triggering vehicle expiry check...");
      const result = await checkAllVehiclesForExpiry();
      console.log("✅ Manual expiry check result:", result.message);
      return result;
    } catch (error) {
      console.error("❌ Error in manual vehicle expiry check:", error);
      throw error;
    }
  }
}

// Create singleton instance
const scheduler = new Scheduler();

// Export the scheduler instance
export default scheduler;

// Export individual functions for convenience
export const initializeScheduler = () => scheduler.initialize();
export const stopScheduler = () => scheduler.stopAll();
export const getSchedulerStatus = () => scheduler.getStatus();
export const triggerVehicleExpiryCheck = () => scheduler.triggerVehicleExpiryCheck();
