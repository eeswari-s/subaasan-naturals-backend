import ActivityLog from "../models/activityLog.model.js";

/**
 * Fire-and-forget audit trail write for meaningful admin/super-admin mutations
 * (settings changes, config updates, content CRUD, logins). Never blocks the
 * request — logging failures are swallowed by the caller via .catch(() => {}).
 */
export const logActivity = ({ actor, actorModel, action, targetType = "", targetId = null, metadata = {}, ipAddress = "" }) =>
  ActivityLog.create({ actor, actorModel, action, targetType, targetId, metadata, ipAddress });

// Convenience wrapper: pulls actor + ip straight off the request.
export const logActivityFromRequest = (req, actorModel, action, { targetType, targetId, metadata } = {}) => {
  const actor = actorModel === "SuperAdmin" ? req.superAdmin?._id : req.admin?._id;
  if (!actor) return Promise.resolve(null);

  return logActivity({
    actor,
    actorModel,
    action,
    targetType,
    targetId,
    metadata,
    ipAddress: req.ip,
  });
};
