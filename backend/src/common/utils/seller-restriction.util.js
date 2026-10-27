function getSellingRestrictionMessage(user) {
  const reason = typeof user.sellingRestrictedReason === 'string'
    ? user.sellingRestrictedReason.trim()
    : '';
  return reason
    ? `Bạn đang bị hạn chế quyền bán: ${reason}`
    : 'Bạn đang bị hạn chế quyền bán';
}

async function refreshSellingRestriction(user, { save = true } = {}) {
  if (!user?.isSellingRestricted) return false;

  const restrictedUntil = user.sellingRestrictedUntil
    ? new Date(user.sellingRestrictedUntil).getTime()
    : null;
  if (restrictedUntil === null || !Number.isFinite(restrictedUntil) || restrictedUntil > Date.now()) {
    return true;
  }

  user.isSellingRestricted = false;
  user.sellingRestrictedUntil = undefined;
  user.sellingRestrictedReason = undefined;
  user.sellingRestrictionSource = undefined;
  if (save) await user.save();
  return false;
}

module.exports = { refreshSellingRestriction, getSellingRestrictionMessage };
