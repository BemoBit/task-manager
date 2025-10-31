import { PrismaClient, TaskStatus, PipelineState } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding sample tasks and usage data...');

  // Get the admin user and phase
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@taskmanager.com' },
  });

  const phase = await prisma.phase.findFirst();
  const provider = await prisma.aIProvider.findFirst();

  if (!adminUser || !phase || !provider) {
    throw new Error('Required data not found. Please run seed first.');
  }

  // Create sample tasks with different statuses
  const tasks = [
    {
      title: 'Build User Authentication System',
      description: 'Implement JWT-based authentication with refresh tokens',
      status: TaskStatus.COMPLETED,
      priority: 5,
      phaseId: phase.id,
      assignedTo: adminUser.id,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      title: 'Create Dashboard Analytics',
      description: 'Build comprehensive dashboard with charts and metrics',
      status: TaskStatus.COMPLETED,
      priority: 4,
      phaseId: phase.id,
      assignedTo: adminUser.id,
      startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Implement AI Provider Integration',
      description: 'Add support for multiple AI providers with fallback',
      status: TaskStatus.IN_PROGRESS,
      priority: 5,
      phaseId: phase.id,
      assignedTo: adminUser.id,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      title: 'Setup CI/CD Pipeline',
      description: 'Configure automated testing and deployment',
      status: TaskStatus.PENDING,
      priority: 3,
      phaseId: phase.id,
    },
    {
      title: 'Add Real-time Notifications',
      description: 'Implement WebSocket-based notification system',
      status: TaskStatus.PENDING,
      priority: 4,
      phaseId: phase.id,
    },
    {
      title: 'Optimize Database Queries',
      description: 'Add indexes and optimize slow queries',
      status: TaskStatus.FAILED,
      priority: 3,
      phaseId: phase.id,
      assignedTo: adminUser.id,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({ data: taskData });
  }

  console.log(`✅ Created ${tasks.length} sample tasks`);

  // Create AI usage logs
  const usageLogs: any[] = [];
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const success = Math.random() > 0.1; // 90% success rate
    const tokensUsed = Math.floor(Math.random() * 2000) + 500;
    const cost = (tokensUsed / 1000) * 0.03; // $0.03 per 1K tokens

    usageLogs.push({
      providerId: provider.id,
      requestData: {
        prompt: 'Sample AI request',
        model: 'gpt-4',
      },
      responseData: success
        ? {
            content: 'Sample AI response',
            tokens: tokensUsed,
          }
        : undefined,
      tokensUsed: success ? tokensUsed : undefined,
      cost: success ? cost : undefined,
      duration: Math.floor(Math.random() * 5000) + 1000,
      success,
      errorMessage: success ? undefined : 'Rate limit exceeded',
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.aIUsageLog.createMany({ data: usageLogs });
  console.log(`✅ Created ${usageLogs.length} AI usage logs`);

  // Create audit logs
  const auditLogs = [
    {
      userId: adminUser.id,
      action: 'CREATE',
      resource: 'TASK',
      resourceId: '1',
      details: { taskTitle: 'Build User Authentication System' },
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      userId: adminUser.id,
      action: 'UPDATE',
      resource: 'TASK',
      resourceId: '1',
      details: { status: 'COMPLETED' },
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      userId: adminUser.id,
      action: 'CREATE',
      resource: 'TEMPLATE',
      resourceId: '1',
      details: { templateName: 'Custom API Template' },
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.auditLog.createMany({ data: auditLogs });
  console.log(`✅ Created ${auditLogs.length} audit logs`);

  console.log('🎉 Sample data added successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
