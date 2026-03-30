/**
 * db_nuke.js
 * Deletes ALL data except ADMIN users and GlobalServices.
 * Run on the production server: node scripts/db_nuke.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Show what will be kept
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true, firstName: true, lastName: true } });
  const services = await prisma.globalService.findMany({ select: { id: true, nameAr: true, nameEn: true } });

  console.log('\n✅ KEEPING these ADMIN users:');
  admins.forEach(a => console.log(`   - ${a.email} (${a.firstName} ${a.lastName})`));

  console.log('\n✅ KEEPING these GlobalServices:');
  services.forEach(s => console.log(`   - ${s.nameAr} / ${s.nameEn}`));

  console.log('\n🔴 Deleting everything else...\n');

  const adminIds = admins.map(a => a.id);

  // ── Delete in dependency order (children first) ──────────────────────────

  // AI
  await prisma.aiMessage.deleteMany({});
  console.log('  ✓ AiMessage');
  await prisma.aiConversation.deleteMany({});
  console.log('  ✓ AiConversation');

  // Room
  await prisma.roomChatMessage.deleteMany({});
  console.log('  ✓ RoomChatMessage');
  await prisma.roomSession.deleteMany({});
  console.log('  ✓ RoomSession');

  // Presence
  await prisma.userPresence.deleteMany({ where: { userId: { notIn: adminIds } } });
  console.log('  ✓ UserPresence (non-admin)');

  // Content
  await prisma.contentItemHistory.deleteMany({});
  console.log('  ✓ ContentItemHistory');
  await prisma.comment.deleteMany({});
  console.log('  ✓ Comment');
  await prisma.contentItem.deleteMany({});
  console.log('  ✓ ContentItem');
  await prisma.actionPlan.deleteMany({});
  console.log('  ✓ ActionPlan');

  // Reports
  await prisma.report.deleteMany({});
  console.log('  ✓ Report');

  // Tasks & Approvals
  await prisma.internalTask.deleteMany({});
  console.log('  ✓ InternalTask');
  await prisma.approvalRequest.deleteMany({});
  console.log('  ✓ ApprovalRequest');

  // Client data
  await prisma.clientRating.deleteMany({});
  console.log('  ✓ ClientRating');
  await prisma.clientInsight.deleteMany({});
  console.log('  ✓ ClientInsight');
  await prisma.service.deleteMany({});
  console.log('  ✓ Service');
  await prisma.serviceRequest.deleteMany({});
  console.log('  ✓ ServiceRequest');
  await prisma.meetingRequest.deleteMany({});
  console.log('  ✓ MeetingRequest');
  await prisma.deletionRequest.deleteMany({});
  console.log('  ✓ DeletionRequest');

  // Social
  await prisma.socialConnection.deleteMany({});
  console.log('  ✓ SocialConnection');

  // Meetings
  await prisma.teamMeetingAttendee.deleteMany({});
  console.log('  ✓ TeamMeetingAttendee');
  await prisma.teamMeeting.deleteMany({});
  console.log('  ✓ TeamMeeting');

  // Messaging
  await prisma.message.deleteMany({});
  console.log('  ✓ Message');
  await prisma.notification.deleteMany({});
  console.log('  ✓ Notification');
  await prisma.activityLog.deleteMany({});
  console.log('  ✓ ActivityLog');

  // HR
  await prisma.hRNote.deleteMany({});
  console.log('  ✓ HRNote');
  await prisma.hRAnnouncement.deleteMany({});
  console.log('  ✓ HRAnnouncement');
  await prisma.leaveRequest.deleteMany({});
  console.log('  ✓ LeaveRequest');
  await prisma.performanceReview.deleteMany({});
  console.log('  ✓ PerformanceReview');

  // Auth tokens
  await prisma.passwordResetToken.deleteMany({});
  console.log('  ✓ PasswordResetToken');

  // Clients (all — including any linked to admin)
  await prisma.client.deleteMany({});
  console.log('  ✓ Client');

  // Users — delete everyone except ADMINs
  const deletedUsers = await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
  console.log(`  ✓ User (deleted ${deletedUsers.count} non-admin users)`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n🎉 Done! Database is clean.\n');

  const remaining = await prisma.user.count();
  const remainingServices = await prisma.globalService.count();
  console.log(`   Users remaining:          ${remaining}`);
  console.log(`   GlobalServices remaining:  ${remainingServices}`);
  console.log('');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
