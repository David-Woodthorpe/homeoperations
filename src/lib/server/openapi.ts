import { appVersion } from './config';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: unknown) => ({ 'application/json': { schema } });
const errorRef = ref('Error');

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' }
};

const pagination = {
  type: 'object',
  properties: {
    total: { type: 'integer' },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
    has_more: { type: 'boolean' }
  }
};

const errorResponses = {
  '400': { description: 'Invalid request', content: json(errorRef) },
  '401': { description: 'Missing or invalid API key', content: json(errorRef) },
  '404': { description: 'Not found', content: json(errorRef) },
  '409': { description: 'Conflict', content: json(errorRef) }
};

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Home Operations API',
    version: appVersion,
    description:
      'A local REST API for a house O&M manual: appliances, service history, maintenance tasks, notes, manuals and photos. ' +
      'Responses are JSON in the form {"data": ...} or {"error": {"code","message","details?"}}. ' +
      'Authentication is optional and controlled by HOME_OPERATIONS_API_KEY. Call GET /meta first.'
  },
  servers: [{ url: '/api/v1', description: 'This server' }],
  tags: [
    { name: 'Discovery', description: 'Metadata, search and exports' },
    { name: 'Appliances', description: 'The appliance and system register' },
    { name: 'Service', description: 'Service, repair and inspection history' },
    { name: 'Pages', description: 'Written notes and procedures' },
    { name: 'Sections', description: 'House system sections' },
    { name: 'Maintenance', description: 'Standing tasks, due dates and warranties' },
    { name: 'Attachments', description: 'Manuals, photos and receipts' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Discovery'],
        summary: 'Health check (never requires an API key)',
        responses: { '200': { description: 'Service is running', content: json({ type: 'object' }) } }
      }
    },
    '/meta': {
      get: {
        tags: ['Discovery'],
        summary: 'Sections, categories, statistics and documentation links',
        description: 'AI agents should call this first and use its section ids.',
        responses: { '200': { description: 'Manual metadata', content: json({ type: 'object' }) } }
      }
    },
    '/appliances': {
      get: {
        tags: ['Appliances'],
        summary: 'List and search appliances',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', 'overdue', 'soon', 'warranty', 'unscheduled'],
              default: 'all'
            }
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['name', 'due', 'warranty', 'updated', 'category'],
              default: 'name'
            }
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Paginated appliances',
            content: json({
              type: 'object',
              properties: {
                data: { type: 'array', items: ref('ApplianceSummary') },
                pagination
              }
            })
          }
        }
      },
      post: {
        tags: ['Appliances'],
        summary: 'Create an appliance',
        description:
          'Provide a name, or both make and model. The name defaults to "Make Model". ' +
          'If section_id/section_slug is omitted, a section is chosen from the category, then House Essentials.',
        requestBody: { required: true, content: json(ref('ApplianceInput')) },
        responses: {
          '201': { description: 'Appliance created', content: json({ type: 'object', properties: { data: ref('Appliance') } }) },
          ...errorResponses
        }
      }
    },
    '/appliances/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Appliances'],
        summary: 'Get an appliance with notes, attachments and service history',
        responses: {
          '200': { description: 'Appliance detail', content: json({ type: 'object', properties: { data: ref('Appliance') } }) },
          ...errorResponses
        }
      },
      patch: {
        tags: ['Appliances'],
        summary: 'Update appliance fields',
        description:
          'Send only the fields to change. Set service_next_due to null to recalculate it from the interval and today.',
        requestBody: { required: true, content: json(ref('ApplianceInput')) },
        responses: {
          '200': { description: 'Updated appliance', content: json({ type: 'object', properties: { data: ref('Appliance') } }) },
          ...errorResponses
        }
      },
      delete: {
        tags: ['Appliances'],
        summary: 'Delete an appliance',
        description: 'Deletes its notes, attachments and service history. Destructive.',
        responses: {
          '200': { description: 'Deleted', content: json({ type: 'object' }) },
          ...errorResponses
        }
      }
    },
    '/appliances/{id}/service': {
      parameters: [idParam],
      get: {
        tags: ['Service'],
        summary: 'List service records',
        responses: {
          '200': {
            description: 'Service history',
            content: json({
              type: 'object',
              properties: { data: { type: 'array', items: ref('ServiceRecord') } }
            })
          },
          ...errorResponses
        }
      },
      post: {
        tags: ['Service'],
        summary: 'Log a service, repair or inspection',
        description:
          'If next_due is omitted, it is calculated from the appliance interval and performed_on.',
        requestBody: { required: true, content: json(ref('ServiceInput')) },
        responses: {
          '201': { description: 'Record created', content: json({ type: 'object', properties: { data: ref('ServiceRecord') } }) },
          ...errorResponses
        }
      }
    },
    '/appliances/{id}/service/{recordId}': {
      parameters: [idParam, { name: 'recordId', in: 'path', required: true, schema: { type: 'string' } }],
      delete: {
        tags: ['Service'],
        summary: 'Delete a service record',
        responses: {
          '200': { description: 'Deleted', content: json({ type: 'object' }) },
          ...errorResponses
        }
      }
    },
    '/pages': {
      get: {
        tags: ['Pages'],
        summary: 'List notes pages',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'section_id', in: 'query', schema: { type: 'string' } },
          { name: 'section_slug', in: 'query', schema: { type: 'string' } },
          { name: 'kind', in: 'query', schema: { type: 'string', enum: ['page', 'appliance'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Paginated pages',
            content: json({
              type: 'object',
              properties: { data: { type: 'array', items: ref('PageSummary') }, pagination }
            })
          }
        }
      },
      post: {
        tags: ['Pages'],
        summary: 'Create a notes page',
        requestBody: { required: true, content: json(ref('PageInput')) },
        responses: {
          '201': { description: 'Page created', content: json({ type: 'object', properties: { data: ref('Page') } }) },
          ...errorResponses
        }
      }
    },
    '/pages/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Pages'],
        summary: 'Get a page with Markdown body',
        responses: {
          '200': { description: 'Page', content: json({ type: 'object', properties: { data: ref('Page') } }) },
          ...errorResponses
        }
      },
      patch: {
        tags: ['Pages'],
        summary: 'Update a normal page',
        description: 'Appliance pages must be updated through /appliances/{id}.',
        requestBody: { required: true, content: json(ref('PageInput')) },
        responses: {
          '200': { description: 'Updated page', content: json({ type: 'object', properties: { data: ref('Page') } }) },
          ...errorResponses
        }
      },
      delete: {
        tags: ['Pages'],
        summary: 'Delete a normal page',
        responses: { '200': { description: 'Deleted', content: json({ type: 'object' }) }, ...errorResponses }
      }
    },
    '/sections': {
      get: {
        tags: ['Sections'],
        summary: 'List sections with counts',
        responses: {
          '200': {
            description: 'Sections',
            content: json({
              type: 'object',
              properties: { data: { type: 'array', items: ref('Section') } }
            })
          }
        }
      },
      post: {
        tags: ['Sections'],
        summary: 'Create a section',
        requestBody: { required: true, content: json(ref('SectionInput')) },
        responses: {
          '201': { description: 'Section created', content: json({ type: 'object', properties: { data: ref('Section') } }) },
          ...errorResponses
        }
      }
    },
    '/sections/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Sections'],
        summary: 'Get a section',
        responses: {
          '200': { description: 'Section', content: json({ type: 'object', properties: { data: ref('Section') } }) },
          ...errorResponses
        }
      },
      patch: {
        tags: ['Sections'],
        summary: 'Rename or describe a section',
        requestBody: { required: true, content: json(ref('SectionInput')) },
        responses: {
          '200': { description: 'Updated section', content: json({ type: 'object', properties: { data: ref('Section') } }) },
          ...errorResponses
        }
      },
      delete: {
        tags: ['Sections'],
        summary: 'Delete an empty section',
        responses: { '200': { description: 'Deleted', content: json({ type: 'object' }) }, ...errorResponses }
      }
    },
    '/maintenance': {
      get: {
        tags: ['Maintenance'],
        summary: 'Combined appliance and task schedule',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Comma-separated: overdue, soon, later, none',
            schema: { type: 'string' }
          },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['appliance', 'task'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } }
        ],
        responses: { '200': { description: 'Schedule, summary, calendar and warranties', content: json({ type: 'object' }) } }
      }
    },
    '/tasks': {
      get: {
        tags: ['Maintenance'],
        summary: 'List standing maintenance tasks',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['overdue', 'soon', 'later', 'none'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Tasks',
            content: json({
              type: 'object',
              properties: { data: { type: 'array', items: ref('Task') }, pagination }
            })
          }
        }
      },
      post: {
        tags: ['Maintenance'],
        summary: 'Create a standing task',
        requestBody: { required: true, content: json(ref('TaskInput')) },
        responses: {
          '201': { description: 'Task created', content: json({ type: 'object', properties: { data: ref('Task') } }) },
          ...errorResponses
        }
      }
    },
    '/tasks/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Maintenance'],
        summary: 'Get a task',
        responses: { '200': { description: 'Task', content: json({ type: 'object', properties: { data: ref('Task') } }) }, ...errorResponses }
      },
      patch: {
        tags: ['Maintenance'],
        summary: 'Update a task',
        requestBody: { required: true, content: json(ref('TaskInput')) },
        responses: { '200': { description: 'Updated task', content: json({ type: 'object', properties: { data: ref('Task') } }) }, ...errorResponses }
      },
      delete: {
        tags: ['Maintenance'],
        summary: 'Delete a task',
        responses: { '200': { description: 'Deleted', content: json({ type: 'object' }) }, ...errorResponses }
      }
    },
    '/tasks/{id}/complete': {
      parameters: [idParam],
      post: {
        tags: ['Maintenance'],
        summary: 'Mark a task done and advance its next due date',
        responses: { '200': { description: 'Completed task', content: json({ type: 'object', properties: { data: ref('Task') } }) }, ...errorResponses }
      }
    },
    '/attachments': {
      get: {
        tags: ['Attachments'],
        summary: 'List attachments for an appliance or page',
        parameters: [
          { name: 'appliance_id', in: 'query', schema: { type: 'string' } },
          { name: 'page_id', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Files', content: json({ type: 'object', properties: { data: { type: 'array', items: ref('Attachment') } } }) }, ...errorResponses }
      },
      post: {
        tags: ['Attachments'],
        summary: 'Upload a manual, photo or receipt',
        description: 'multipart/form-data with file, appliance_id or page_id, kind and caption.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  appliance_id: { type: 'string' },
                  page_id: { type: 'string' },
                  kind: { type: 'string', enum: ['document', 'photo', 'receipt'] },
                  caption: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'File uploaded', content: json({ type: 'object', properties: { data: ref('Attachment') } }) }, ...errorResponses }
      }
    },
    '/attachments/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Attachments'],
        summary: 'Get attachment metadata',
        responses: { '200': { description: 'Attachment', content: json({ type: 'object', properties: { data: ref('Attachment') } }) }, ...errorResponses }
      },
      delete: {
        tags: ['Attachments'],
        summary: 'Delete an attachment',
        responses: { '200': { description: 'Deleted', content: json({ type: 'object' }) }, ...errorResponses }
      }
    },
    '/attachments/{id}/file': {
      parameters: [idParam],
      get: {
        tags: ['Attachments'],
        summary: 'Download the file bytes',
        parameters: [
          { name: 'download', in: 'query', schema: { type: 'string', enum: ['1'] }, description: 'Force a download' }
        ],
        responses: { '200': { description: 'File', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } }, ...errorResponses }
      }
    },
    '/search': {
      get: {
        tags: ['Discovery'],
        summary: 'Search appliances and notes together',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 60, default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } }
        ],
        responses: { '200': { description: 'Search results', content: json({ type: 'object', properties: { data: { type: 'array', items: ref('SearchResult') } } }) }, ...errorResponses }
      }
    },
    '/warranties': {
      get: {
        tags: ['Maintenance'],
        summary: 'List warranties ending within a window',
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', minimum: 0, maximum: 3650, default: 90 } }],
        responses: { '200': { description: 'Warranties', content: json({ type: 'object', properties: { data: { type: 'array', items: ref('Warranty') } } }) } }
      }
    },
    '/export': {
      get: {
        tags: ['Discovery'],
        summary: 'Export the whole manual as JSON, including attachments',
        responses: { '200': { description: 'Backup payload', content: json({ type: 'object' }) } }
      }
    },
    '/backup': {
      get: {
        tags: ['Discovery'],
        summary: 'Download a consistent SQLite database snapshot',
        responses: { '200': { description: 'SQLite database', content: { 'application/vnd.sqlite3': { schema: { type: 'string', format: 'binary' } } } } }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-Api-Key' }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object', nullable: true }
            }
          }
        }
      },
      SectionRef: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          icon: { type: 'string' }
        }
      },
      Section: {
        allOf: [
          ref('SectionRef'),
          {
            type: 'object',
            properties: {
              description: { type: 'string' },
              sort_order: { type: 'integer' },
              page_count: { type: 'integer' },
              appliance_count: { type: 'integer' },
              last_updated: { type: 'string', format: 'date-time', nullable: true },
              url: { type: 'string' }
            }
          }
        ]
      },
      SectionInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' }
        }
      },
      ApplianceSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          make: { type: 'string', nullable: true },
          model: { type: 'string', nullable: true },
          serial: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          section: ref('SectionRef'),
          installed_on: { type: 'string', format: 'date', nullable: true },
          warranty_until: { type: 'string', format: 'date', nullable: true },
          warranty_status: { type: 'string', enum: ['none', 'expired', 'expiring', 'active'] },
          days_until_warranty: { type: 'integer', nullable: true },
          service_interval_months: { type: 'integer', nullable: true },
          service_next_due: { type: 'string', format: 'date', nullable: true },
          service_status: { type: 'string', enum: ['none', 'overdue', 'soon', 'later'] },
          service_due: { type: 'boolean' },
          days_until_service: { type: 'integer', nullable: true },
          last_service: { type: 'string', format: 'date', nullable: true },
          attachment_count: { type: 'integer' },
          updated_at: { type: 'string', format: 'date-time' },
          url: { type: 'string' }
        }
      },
      Appliance: {
        allOf: [
          ref('ApplianceSummary'),
          {
            type: 'object',
            properties: {
              supplier: { type: 'string', nullable: true },
              manual_url: { type: 'string', nullable: true },
              pinned: { type: 'boolean' },
              body: { type: 'string', description: 'Markdown operation notes' },
              body_text: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              attachments: { type: 'array', items: ref('Attachment') },
              service_records: { type: 'array', items: ref('ServiceRecord') },
              links: { type: 'object' }
            }
          }
        ]
      },
      ApplianceInput: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Defaults to "Make Model"' },
          make: { type: 'string' },
          model: { type: 'string' },
          serial: { type: 'string' },
          location: { type: 'string' },
          category: { type: 'string' },
          section_id: { type: 'string' },
          section_slug: { type: 'string' },
          installed_on: { type: 'string', format: 'date' },
          warranty_until: { type: 'string', format: 'date' },
          service_interval_months: { type: 'integer', minimum: 1, maximum: 240, nullable: true },
          service_next_due: { type: 'string', format: 'date', nullable: true },
          supplier: { type: 'string' },
          manual_url: { type: 'string' },
          pinned: { type: 'boolean' },
          body: { type: 'string', description: 'Markdown operation notes' }
        }
      },
      ServiceRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          performed_on: { type: 'string', format: 'date' },
          kind: { type: 'string', enum: ['service', 'repair', 'inspection', 'install', 'other'] },
          engineer: { type: 'string', nullable: true },
          company: { type: 'string', nullable: true },
          cost: { type: 'number', nullable: true },
          notes: { type: 'string', nullable: true },
          next_due: { type: 'string', format: 'date', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ServiceInput: {
        type: 'object',
        properties: {
          performed_on: { type: 'string', format: 'date', description: 'Defaults to today' },
          kind: { type: 'string', enum: ['service', 'repair', 'inspection', 'install', 'other'] },
          engineer: { type: 'string' },
          company: { type: 'string' },
          cost: { type: 'number', minimum: 0 },
          notes: { type: 'string' },
          next_due: { type: 'string', format: 'date' }
        }
      },
      PageSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          kind: { type: 'string', enum: ['page', 'appliance'] },
          pinned: { type: 'boolean' },
          section: ref('SectionRef'),
          updated_at: { type: 'string', format: 'date-time' },
          snippet: { type: 'string' },
          url: { type: 'string' }
        }
      },
      Page: {
        allOf: [
          ref('PageSummary'),
          {
            type: 'object',
            properties: {
              body: { type: 'string', description: 'Markdown' },
              body_text: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              attachments: { type: 'array', items: ref('Attachment') },
              links: { type: 'object' }
            }
          }
        ]
      },
      PageInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          section_id: { type: 'string' },
          section_slug: { type: 'string' },
          pinned: { type: 'boolean' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string', nullable: true },
          interval_months: { type: 'integer', nullable: true },
          next_due: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['none', 'overdue', 'soon', 'later'] },
          days_until_due: { type: 'integer', nullable: true },
          last_done: { type: 'string', format: 'date', nullable: true },
          notes: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          url: { type: 'string' }
        }
      },
      TaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          interval_months: { type: 'integer', minimum: 1, maximum: 240, nullable: true },
          next_due: { type: 'string', format: 'date', description: 'Omit to calculate from last_done and the interval' },
          last_done: { type: 'string', format: 'date' },
          notes: { type: 'string' }
        }
      },
      Attachment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          page_id: { type: 'string' },
          filename: { type: 'string' },
          mime_type: { type: 'string' },
          size: { type: 'integer' },
          kind: { type: 'string', enum: ['document', 'photo', 'receipt'] },
          caption: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          url: { type: 'string' },
          file_url: { type: 'string' },
          download_url: { type: 'string' }
        }
      },
      MaintenanceItem: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['appliance', 'task'] },
          id: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          due: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['none', 'overdue', 'soon', 'later'] },
          days_until_due: { type: 'integer', nullable: true },
          interval_months: { type: 'integer', nullable: true },
          last_done: { type: 'string', format: 'date', nullable: true },
          url: { type: 'string' }
        }
      },
      Warranty: {
        type: 'object',
        properties: {
          appliance_id: { type: 'string' },
          title: { type: 'string' },
          section_name: { type: 'string' },
          warranty_until: { type: 'string', format: 'date' },
          days_until_expiry: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['none', 'expired', 'expiring', 'active'] },
          url: { type: 'string' }
        }
      },
      SearchResult: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          kind: { type: 'string', enum: ['page', 'appliance'] },
          section: { type: 'object' },
          meta: { type: 'string', nullable: true },
          snippet: { type: 'string' },
          updated_at: { type: 'string', format: 'date-time' },
          url: { type: 'string' }
        }
      }
    }
  }
};
