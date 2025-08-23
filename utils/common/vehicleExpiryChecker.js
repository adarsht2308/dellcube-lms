import { Vehicle } from "../../models/vehicle.js";
import { User } from "../../models/user.js";
import { sendVehicleExpiryNotification } from "./sendMail.js";

// Function to get recipients for vehicle notifications
const getVehicleNotificationRecipients = async (vehicle) => {
  try {
    const recipients = [];
    
    // Get super admin users
    const superAdmins = await User.find({ role: "superAdmin" }).select("email name");
    recipients.push(...superAdmins);
    
    // Get branch admin users for this vehicle's company and branch
    if (vehicle.company && vehicle.branch) {
      const branchAdmins = await User.find({ 
        role: "branchAdmin", 
        company: vehicle.company,
        branch: vehicle.branch 
      }).select("email name");
      recipients.push(...branchAdmins);
    }
    
    // Get operation users for this vehicle's company and branch
    if (vehicle.company && vehicle.branch) {
      const operationUsers = await User.find({ 
        role: "operation", 
        company: vehicle.company,
        branch: vehicle.branch 
      }).select("email name");
      recipients.push(...operationUsers);
    }
    
    // Get driver if they have an email
    if (vehicle.currentDriver) {
      const driver = await User.findById(vehicle.currentDriver).select("email name");
      if (driver && driver.email) {
        recipients.push(driver);
      }
    }
    
    // Remove duplicates based on email
    const uniqueRecipients = recipients.filter((recipient, index, self) => 
      index === self.findIndex(r => r.email === recipient.email)
    );
    
    return uniqueRecipients;
  } catch (error) {
    console.error("Error getting vehicle notification recipients:", error);
    return [];
  }
};

// Main function to check all vehicles for expiring documents
export const checkAllVehiclesForExpiry = async () => {
  try {
    console.log("Starting vehicle document expiry check...");
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Get all vehicles with populated company, branch, and currentDriver
    const vehicles = await Vehicle.find({})
      .populate("company", "name")
      .populate("branch", "name")
      .populate("currentDriver", "name");
    
    let totalNotifications = 0;
    let successfulEmails = 0;
    let failedEmails = 0;
    
    for (const vehicle of vehicles) {
      const checks = [
        { type: 'Fitness Certificate', date: vehicle.fitnessCertificateExpiry, field: 'fitnessCertificateExpiry' },
        { type: 'Insurance', date: vehicle.insuranceExpiry, field: 'insuranceExpiry' },
        { type: 'Pollution Certificate', date: vehicle.pollutionCertificateExpiry, field: 'pollutionCertificateExpiry' }
      ];
      
      for (const check of checks) {
        if (check.date) {
          const expiryDate = new Date(check.date);
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          // Send notifications for documents expiring within 30 days or already expired
          if (daysUntilExpiry <= 30) {
            try {
              // Get recipients for this vehicle
              const recipients = await getVehicleNotificationRecipients(vehicle);
              
              if (recipients.length > 0) {
                // Send email notification
                const emailResult = await sendVehicleExpiryNotification(
                  recipients,
                  vehicle,
                  check.type,
                  expiryDate,
                  daysUntilExpiry
                );
                
                totalNotifications++;
                if (emailResult.success) {
                  successfulEmails += emailResult.successful;
                  failedEmails += emailResult.failed;
                }
                
                console.log(`Email notification sent for ${vehicle.vehicleNumber} - ${check.type}: ${emailResult.message}`);
              }
            } catch (error) {
              console.error(`Error sending notification for ${vehicle.vehicleNumber} - ${check.type}:`, error);
              failedEmails++;
            }
          }
        }
      }
    }
    
    console.log(`Vehicle expiry check completed: ${totalNotifications} notifications processed, ${successfulEmails} emails sent successfully, ${failedEmails} failed`);
    
    return {
      success: true,
      totalNotifications,
      successfulEmails,
      failedEmails,
      message: `Processed ${totalNotifications} notifications`
    };
  } catch (error) {
    console.error("Error in vehicle expiry check:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to check a specific vehicle for expiry (can be called manually)
export const checkVehicleForExpiry = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId)
      .populate("company", "name")
      .populate("branch", "name")
      .populate("currentDriver", "name");
    
    if (!vehicle) {
      return { success: false, message: "Vehicle not found" };
    }
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const checks = [
      { type: 'Fitness Certificate', date: vehicle.fitnessCertificateExpiry, field: 'fitnessCertificateExpiry' },
      { type: 'Insurance', date: vehicle.insuranceExpiry, field: 'insuranceExpiry' },
      { type: 'Pollution Certificate', date: vehicle.pollutionCertificateExpiry, field: 'pollutionCertificateExpiry' }
    ];
    
    let notificationsSent = 0;
    
    for (const check of checks) {
      if (check.date) {
        const expiryDate = new Date(check.date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 1000));
        
        if (daysUntilExpiry <= 30) {
          try {
            const recipients = await getVehicleNotificationRecipients(vehicle);
            
            if (recipients.length > 0) {
              const emailResult = await sendVehicleExpiryNotification(
                recipients,
                vehicle,
                check.type,
                expiryDate,
                daysUntilExpiry
              );
              
              if (emailResult.success) {
                notificationsSent++;
                console.log(`Email notification sent for ${vehicle.vehicleNumber} - ${check.type}: ${emailResult.message}`);
              }
            }
          } catch (error) {
            console.error(`Error sending notification for ${vehicle.vehicleNumber} - ${check.type}:`, error);
          }
        }
      }
    }
    
    return {
      success: true,
      notificationsSent,
      message: `Sent ${notificationsSent} notifications for vehicle ${vehicle.vehicleNumber}`
    };
  } catch (error) {
    console.error("Error checking specific vehicle for expiry:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
