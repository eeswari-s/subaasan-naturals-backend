import Notification from "../models/notification.model.js";

export const createNotification = async ({ recipient, recipientModel, title, message, type = "system", link = "" }) =>
  Notification.create({ recipient, recipientModel, title, message, type, link });

export const notifyUser = (userId, { title, message, type, link }) =>
  createNotification({ recipient: userId, recipientModel: "User", title, message, type, link });

export const notifyAllAdmins = async (Admin, { title, message, type, link }) => {
  const admins = await Admin.find({ isActive: true }).select("_id");
  return Promise.all(
    admins.map((admin) =>
      createNotification({ recipient: admin._id, recipientModel: "Admin", title, message, type, link })
    )
  );
};
