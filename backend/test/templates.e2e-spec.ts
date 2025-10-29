import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../database/prisma.service';

describe('Templates API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let templateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register and login a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'template-test@example.com',
        password: 'SecurePass123!',
        firstName: 'Template',
        lastName: 'Tester',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'template-test@example.com',
        password: 'SecurePass123!',
      });

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (userId) {
      await prisma.template.deleteMany({ where: { createdBy: userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await app.close();
  });

  describe('POST /templates', () => {
    it('should create a new template', async () => {
      const createDto = {
        name: 'Test Template',
        description: 'A test template',
        type: 'CUSTOM',
        content: {
          sections: [
            {
              id: 'section-1',
              title: 'Test Section',
              type: 'custom',
              content: 'Test content with {{variable}}',
              order: 0,
              subsections: [],
              variables: [],
            },
          ],
          globalVariables: [
            {
              id: 'var-1',
              name: 'variable',
              type: 'string',
              scope: 'global',
              required: true,
              defaultValue: 'test value',
            },
          ],
        },
        accessLevel: 'PRIVATE',
        category: 'test',
        tags: ['test', 'example'],
      };

      const response = await request(app.getHttpServer())
        .post('/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createDto.name);
      expect(response.body.version).toBe('1.0.0');

      templateId = response.body.id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/templates')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('GET /templates', () => {
    it('should list templates with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter templates by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'test' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].category).toBe('test');
    });
  });

  describe('GET /templates/:id', () => {
    it('should get a template by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(templateId);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('versions');
    });

    it('should return 404 for non-existent template', async () => {
      await request(app.getHttpServer())
        .get('/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /templates/:id/validate', () => {
    it('should validate template content', async () => {
      const validateDto = {
        content: {
          sections: [
            {
              id: 'section-1',
              title: 'Valid Section',
              type: 'custom',
              content: 'Content',
              order: 0,
              subsections: [],
              variables: [],
            },
          ],
          globalVariables: [],
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/templates/${templateId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validateDto)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /templates/:id/render', () => {
    it('should render template with variables', async () => {
      const renderDto = {
        variables: {
          variable: 'rendered value',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/templates/${templateId}/render`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(renderDto)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('output');
      expect(response.body.output).toContain('rendered value');
    });
  });

  describe('POST /templates/:id/fork', () => {
    it('should fork a template', async () => {
      const forkDto = {
        name: 'Forked Template',
        description: 'Fork of test template',
      };

      const response = await request(app.getHttpServer())
        .post(`/templates/${templateId}/fork`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(forkDto)
        .expect(201);

      expect(response.body.name).toBe(forkDto.name);
      expect(response.body.forkedFrom).toBe(templateId);
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('GET /templates/:id/versions', () => {
    it('should get template versions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/templates/${templateId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('version');
    });
  });

  describe('PUT /templates/:id', () => {
    it('should update a template', async () => {
      const updateDto = {
        name: 'Updated Template Name',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.version).not.toBe('1.0.0'); // Version should increment
    });
  });

  describe('DELETE /templates/:id', () => {
    it('should soft delete a template', async () => {
      await request(app.getHttpServer())
        .delete(`/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify soft delete (template still exists but marked deleted)
      const deletedTemplate = await prisma.template.findUnique({
        where: { id: templateId },
      });

      expect(deletedTemplate?.isDeleted).toBe(true);
    });
  });
});
