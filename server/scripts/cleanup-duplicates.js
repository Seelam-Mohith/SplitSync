// Run this in MongoDB Shell (mongosh) or Atlas playground
// It keeps the oldest record per group+member+month+year and deletes the rest

db.payments.aggregate([
  {
    $group: {
      _id: { groupId: "$groupId", memberId: "$memberId", month: "$month", year: "$year" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
      oldest: { $min: "$createdAt" }
    }
  },
  { $match: { count: { $gt: 1 } } }
]).forEach(function(doc) {
  // Keep the first ID (oldest), delete the rest
  const toDelete = doc.ids.slice(1);
  if (toDelete.length > 0) {
    print("Removing " + toDelete.length + " duplicates for group=" + doc._id.groupId + " member=" + doc._id.memberId);
    db.payments.deleteMany({ _id: { $in: toDelete } });
  }
});

print("Done. Remaining records:");
db.payments.countDocuments();
