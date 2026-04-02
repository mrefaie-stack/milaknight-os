import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import type Anthropic from "@anthropic-ai/sdk";

export type AiTool = {
  definition: FunctionDeclaration;
  roles: string[]; // Which roles can use this tool
};

export const aiTools: AiTool[] = [
  // ==================== READ TOOLS (All roles with appropriate filtering) ====================
  {
    definition: {
      name: "get_clients",
      description:
        "Get a list of clients. For ADMIN/MODERATOR: returns all clients. For AM: returns only their assigned clients. Not available for CLIENT role.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN", "AM", "MODERATOR"],
  },
  {
    definition: {
      name: "get_action_plans",
      description:
        "Get action plans. Filtered by role automatically. Optionally filter by clientId.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          clientId: {
            type: SchemaType.STRING,
            description: "Optional client ID to filter plans for",
          },
        },
        required: [],
      },
    },
    roles: ["ADMIN", "AM", "CLIENT", "MODERATOR"],
  },
  {
    definition: {
      name: "get_reports",
      description:
        "Get performance reports. Filtered by role automatically. ADMIN sees all, AM sees their clients, CLIENT sees their own sent reports.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN", "AM", "CLIENT"],
  },
  {
    definition: {
      name: "get_report_by_id",
      description: "Get a specific report by its ID with full metrics data.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          reportId: {
            type: SchemaType.STRING,
            description: "The report ID",
          },
        },
        required: ["reportId"],
      },
    },
    roles: ["ADMIN", "AM", "CLIENT", "MODERATOR"],
  },
  {
    definition: {
      name: "get_notifications",
      description: "Get the current user's notifications.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN", "AM", "CLIENT", "MODERATOR"],
  },
  {
    definition: {
      name: "get_team_members",
      description: "Get all team members (AMs and Moderators). Admin only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "get_recent_activities",
      description: "Get recent activity logs across the system. Admin only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "get_meeting_requests",
      description:
        "Get meeting requests. Admin sees all, AM sees their clients, Client sees their own.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN", "AM", "CLIENT"],
  },
  {
    definition: {
      name: "query_analytics",
      description:
        "Query analytics data from reports. Can compare months, calculate growth, find best performing metrics. Use this to answer questions about performance, followers, engagement, reach, etc.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          clientId: {
            type: SchemaType.STRING,
            description: "Client ID to query analytics for",
          },
          month: {
            type: SchemaType.STRING,
            description:
              'Specific month to query (format: "YYYY-MM"), or leave empty for latest',
          },
          compareWithPrevious: {
            type: SchemaType.BOOLEAN,
            description:
              "If true, also fetch previous month for comparison",
          },
        },
        required: ["clientId"],
      },
    },
    roles: ["ADMIN", "AM", "CLIENT"],
  },

  // ==================== WRITE TOOLS ====================
  {
    definition: {
      name: "create_client",
      description: "Create a new client profile. Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          industry: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING, description: "Login email for the client" },
          password: { type: SchemaType.STRING, description: "Login password for the client" },
          package: { type: SchemaType.STRING, format: "enum", enum: ["BASIC", "PREMIUM", "ENTERPRISE"] },
          activeServices: { type: SchemaType.STRING, description: "Comma separated list of active platforms" },
          briefAr: { type: SchemaType.STRING },
          briefEn: { type: SchemaType.STRING },
          amId: { type: SchemaType.STRING, description: "Account Manager ID" },
          mmId: { type: SchemaType.STRING, description: "Marketing Manager ID" }
        },
        required: ["name", "email", "password"],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "update_client",
      description: "Update an existing client profile. Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          clientId: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          industry: { type: SchemaType.STRING },
          package: { type: SchemaType.STRING, format: "enum", enum: ["BASIC", "PREMIUM", "ENTERPRISE"] },
          activeServices: { type: SchemaType.STRING },
          briefAr: { type: SchemaType.STRING },
          briefEn: { type: SchemaType.STRING },
          seoScore: { type: SchemaType.NUMBER },
          monthlyFee: { type: SchemaType.NUMBER }
        },
        required: ["clientId"],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "delete_client",
      description: "Delete a client profile. This is a destructive action! Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          clientId: { type: SchemaType.STRING }
        },
        required: ["clientId"],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "create_team_member",
      description: "Create a new team member. Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          email: { type: SchemaType.STRING },
          password: { type: SchemaType.STRING },
          firstName: { type: SchemaType.STRING },
          lastName: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING, format: "enum", enum: ["AM", "MODERATOR", "MARKETING_MANAGER", "CONTENT_TEAM", "CONTENT_LEADER", "ART_TEAM", "ART_LEADER", "SEO_TEAM", "SEO_LEAD", "HR_MANAGER"] }
        },
        required: ["email", "password", "firstName", "lastName", "role"],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "update_team_member",
      description: "Update a team member's details. Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          userId: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          firstName: { type: SchemaType.STRING },
          lastName: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING }
        },
        required: ["userId"],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "delete_team_member",
      description: "Delete a team member. Fails if they have assigned clients. Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          userId: { type: SchemaType.STRING }
        },
        required: ["userId"],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "delete_action_plan",
      description: "Delete an entire action plan. Destructive! Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          planId: { type: SchemaType.STRING }
        },
        required: ["planId"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "delete_report",
      description: "Delete a performance report. Destructive! Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          reportId: { type: SchemaType.STRING }
        },
        required: ["reportId"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "update_content_item",
      description: "Update an existing content item in an action plan. Admin/AM only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          itemId: { type: SchemaType.STRING },
          planId: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          platform: { type: SchemaType.STRING },
          captionAr: { type: SchemaType.STRING },
          captionEn: { type: SchemaType.STRING },
          scheduledDate: { type: SchemaType.STRING },
        },
        required: ["itemId", "planId"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "create_action_plan",
      description:
        'Create a new action plan draft for a client. AM/Admin only. Month format: "YYYY-MM".',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          clientId: {
            type: SchemaType.STRING,
            description: "The client ID to create the plan for",
          },
          month: {
            type: SchemaType.STRING,
            description: 'Month in "YYYY-MM" format, e.g. "2026-03"',
          },
        },
        required: ["clientId", "month"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "add_content_item",
      description:
        "Add a content item (post, poll, article, email) to an action plan. AM/Admin only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          planId: {
            type: SchemaType.STRING,
            description: "The action plan ID",
          },
          type: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["POST", "POLL", "ARTICLE", "EMAIL"],
            description: "Type of content",
          },
          platform: {
            type: SchemaType.STRING,
            format: "enum",
            enum: [
              "Facebook",
              "Instagram",
              "LinkedIn",
              "TikTok",
              "YouTube",
              "Snapchat",
              "X",
            ],
            description: "Target platform",
          },
          captionAr: {
            type: SchemaType.STRING,
            description: "Arabic caption",
          },
          captionEn: {
            type: SchemaType.STRING,
            description: "English caption",
          },
          scheduledDate: {
            type: SchemaType.STRING,
            description: "Scheduled date in ISO format",
          },
        },
        required: ["planId", "type"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "submit_plan_for_approval",
      description:
        "Submit an action plan to the client for approval. AM/Admin only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          planId: {
            type: SchemaType.STRING,
            description: "The action plan ID to submit",
          },
        },
        required: ["planId"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "approve_action_plan",
      description: "Approve an entire action plan. Client only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          planId: {
            type: SchemaType.STRING,
            description: "The action plan ID to approve",
          },
        },
        required: ["planId"],
      },
    },
    roles: ["CLIENT"],
  },
  {
    definition: {
      name: "approve_content_item",
      description: "Approve a specific content item in an action plan. Client only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          itemId: {
            type: SchemaType.STRING,
            description: "The content item ID",
          },
          planId: {
            type: SchemaType.STRING,
            description: "The action plan ID",
          },
        },
        required: ["itemId", "planId"],
      },
    },
    roles: ["CLIENT"],
  },
  {
    definition: {
      name: "schedule_action_plan",
      description:
        "Mark an approved action plan as scheduled. Moderator only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          planId: {
            type: SchemaType.STRING,
            description: "The action plan ID to schedule",
          },
        },
        required: ["planId"],
      },
    },
    roles: ["MODERATOR"],
  },
  {
    definition: {
      name: "publish_report",
      description:
        "Publish/send a report to the client. AM/Admin only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          reportId: {
            type: SchemaType.STRING,
            description: "The report ID to publish",
          },
        },
        required: ["reportId"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "send_notification",
      description:
        "Send a notification/reminder to a specific user.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          targetUserId: {
            type: SchemaType.STRING,
            description: "The user ID to send the notification to",
          },
          title: {
            type: SchemaType.STRING,
            description: "Notification title",
          },
          message: {
            type: SchemaType.STRING,
            description: "Notification message",
          },
        },
        required: ["targetUserId", "title", "message"],
      },
    },
    roles: ["ADMIN", "AM"],
  },
  {
    definition: {
      name: "request_meeting",
      description: "Request a meeting. Client only.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          reason: {
            type: SchemaType.STRING,
            description: "Reason for the meeting",
          },
          teams: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description:
              'Required teams, e.g. ["Content", "Design", "Marketing"]',
          },
        },
        required: ["reason", "teams"],
      },
    },
    roles: ["CLIENT"],
  },
];

export function getToolsForRole(role: string): FunctionDeclaration[] {
  return aiTools
    .filter((t) => t.roles.includes(role))
    .map((t) => t.definition);
}

export function isToolAllowedForRole(
  toolName: string,
  role: string
): boolean {
  const tool = aiTools.find((t) => t.definition.name === toolName);
  return tool ? tool.roles.includes(role) : false;
}

// ---- Claude (Anthropic) format ----

function toJsonSchema(schema: any): any {
  if (!schema) return { type: "object", properties: {} };
  const typeMap: Record<string, string> = {
    OBJECT: "object", STRING: "string", NUMBER: "number",
    BOOLEAN: "boolean", ARRAY: "array", INTEGER: "integer",
  };
  const out: any = {};
  if (schema.type) out.type = typeMap[String(schema.type).toUpperCase()] ?? String(schema.type).toLowerCase();
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.properties) {
    out.properties = {};
    for (const [k, v] of Object.entries(schema.properties)) {
      out.properties[k] = toJsonSchema(v);
    }
  }
  if (schema.required) out.required = schema.required;
  if (schema.items) out.items = toJsonSchema(schema.items);
  return out;
}

export function getClaudeToolsForRole(role: string): Anthropic.Tool[] {
  return aiTools
    .filter((t) => t.roles.includes(role))
    .map((t) => ({
      name: t.definition.name,
      description: t.definition.description ?? "",
      input_schema: toJsonSchema(t.definition.parameters) as Anthropic.Tool["input_schema"],
    }));
}
