import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@taskmanager.com' },
    update: {},
    create: {
      email: 'admin@taskmanager.com',
      password: '$2b$10$YourHashedPasswordHere', // Change this to a proper hashed password
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create default AI Providers
  const openAIProvider = await prisma.aIProvider.upsert({
    where: { name: 'OpenAI GPT-4' },
    update: {},
    create: {
      name: 'OpenAI GPT-4',
      type: 'OPENAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
      model: 'gpt-4-turbo-preview',
      settings: {
        organization: '',
      },
      isActive: true,
      maxTokens: 4096,
      temperature: 0.7,
    },
  });

  console.log('✅ Created AI Provider:', openAIProvider.name);

  // Create default decomposition template
  const decompositionTemplate = await prisma.template.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Task Decomposition Template',
      description: 'Default template for breaking down tasks into subtasks',
      type: 'DECOMPOSITION',
      version: '1.0.0',
      isActive: true,
      isPublic: true,
      createdBy: adminUser.id,
      content: {
        sections: [
          {
            id: 'data-model',
            name: 'Data Model Definition',
            order: 1,
            fields: [
              { name: 'entities', type: 'array', required: true },
              { name: 'relationships', type: 'array', required: true },
            ],
          },
          {
            id: 'services',
            name: 'Services Architecture',
            order: 2,
            fields: [
              { name: 'services', type: 'array', required: true },
              { name: 'dependencies', type: 'array', required: false },
            ],
          },
          {
            id: 'http-api',
            name: 'HTTP/API Requests',
            order: 3,
            fields: [
              { name: 'endpoints', type: 'array', required: true },
              { name: 'methods', type: 'array', required: true },
            ],
          },
          {
            id: 'testing',
            name: 'Test Scenarios',
            order: 4,
            fields: [
              { name: 'testCases', type: 'array', required: true },
              { name: 'coverage', type: 'number', required: false },
            ],
          },
        ],
        variables: [],
        rules: [],
      },
    },
  });

  console.log('✅ Created template:', decompositionTemplate.name);

  // Create default phase
  const phase = await prisma.phase.create({
    data: {
      name: 'Initial Decomposition',
      description: 'Break down the main task into structured subtasks',
      order: 1,
      templateId: decompositionTemplate.id,
      aiProviderId: openAIProvider.id,
      config: {
        maxRetries: 3,
        timeout: 30000,
        promptTemplate: 'Analyze and decompose the following task: {{task_description}}',
      },
      isActive: true,
    },
  });

  console.log('✅ Created phase:', phase.name);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
