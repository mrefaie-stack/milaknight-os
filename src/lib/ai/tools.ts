import type Anthropic from "@anthropic-ai/sdk";

export type AiTool = {
  definition: Anthropic.Tool;
  roles: string[]; // Which roles can use this tool
};

export const aiTools: AiTool[] = [
  // ==================== READ TOOLS (All roles with appropriate filtering) ====================
  {
    definition: {
      name: "get_clients",
      description:
        "Get a list of clients. For ADMIN/MODERATOR: returns all clients. For AM: returns only their assigned clients. Not available for CLIENT role.",
      input_schema: {
        type: "object" as const,
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
      input_schema: {
        type: "object" as const,
        properties: {
          clientId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
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
      input_schema: {
        type: "object" as const,
        properties: {
          reportId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
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
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "get_recent_activities",
      description: "Get recent activity logs across the system. Admin only.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    roles: ["ADMIN"],
  },
  {
    definition: {
      name: "get_meeting_requests",
      description:
        "Get meeting requests. Admin sees all, AM sees their clients, Client sees their own.",
      input_schema: {
        type: "object" as const,
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
      input_schema: {
        type: "object" as const,
        properties: {
          clientId: {
            type: "string",
            description: "Client ID to query analytics for",
          },
          month: {
            type: "string",
            description:
              'Specific month to query (format: "YYYY-MM"), or leave empty for latest',
          },
          compareWithPrevious: {
            type: "boolean",
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
      name: "create_action_plan",
      description:
        'Create a new action plan draft for a client. AM/Admin only. Month format: "YYYY-MM".',
      input_schema: {
        type: "object" as const,
        properties: {
          clientId: {
            type: "string",
            description: "The client ID to create the plan for",
          },
          month: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          planId: {
            type: "string",
            description: "The action plan ID",
          },
          type: {
            type: "string",
            enum: ["POST", "POLL", "ARTICLE", "EMAIL"],
            description: "Type of content",
          },
          platform: {
            type: "string",
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
            type: "string",
            description: "Arabic caption",
          },
          captionEn: {
            type: "string",
            description: "English caption",
          },
          scheduledDate: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          planId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          planId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          itemId: {
            type: "string",
            description: "The content item ID",
          },
          planId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          planId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          reportId: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          targetUserId: {
            type: "string",
            description: "The user ID to send the notification to",
          },
          title: {
            type: "string",
            description: "Notification title",
          },
          message: {
            type: "string",
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
      input_schema: {
        type: "object" as const,
        properties: {
          reason: {
            type: "string",
            description: "Reason for the meeting",
          },
          teams: {
            type: "array",
            items: { type: "string" },
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

export function getToolsForRole(role: string): Anthropic.Tool[] {
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
