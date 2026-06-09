import { SLACK_CHANNELS } from '../config'
import type { Lead, Callback, Priority } from '../types'

const SLACK_TOKEN = () => process.env.SLACK_BOT_TOKEN?.trim()
const SLACK_CHANNEL_ID = (key: keyof typeof SLACK_CHANNELS): string => process.env[`SLACK_CHANNEL_${key.toUpperCase()}`] ?? SLACK_CHANNELS[key]

async function post(channel: string, text: string, blocks?: unknown[]): Promise<boolean> {
  const token = SLACK_TOKEN()
  if (!token) return false
  const isMock = process.env.MOCK_MODE === 'true'
  const prefix = isMock ? '[MOCK TEST] ' : ''
  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel,
        text: `${prefix}${text}`,
        ...(blocks ? { blocks, unfurl_links: false } : { unfurl_links: false }),
      }),
    })
    const data = await res.json() as { ok?: boolean }
    return data.ok === true
  } catch {
    return false
  }
}

export async function alertNewLead(lead: Lead): Promise<boolean> {
  const channel = SLACK_CHANNEL_ID('new_leads')
  const valueStr = lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : 'N/A'
  const text = [
    `*New Lead: ${lead.name}*`,
    `Company: ${lead.company ?? 'N/A'}`,
    `Service: ${lead.service_requested ?? 'Not specified'}`,
    `Budget: ${lead.budget_range ?? 'N/A'}`,
    `Timeline: ${lead.timeline ?? 'N/A'}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email ?? 'N/A'}`,
    `Priority: ${lead.priority.toUpperCase()}`,
    `Revenue: ${valueStr}`,
    `Stage: ${lead.pipeline_stage}`,
    `Source: ${lead.source}`,
    `Agent: ${lead.assigned_agent ?? 'Unassigned'}`,
    `Action: ${getActionText(lead)}`,
  ].join('\n')

  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `🔔 *New Lead — ${lead.priority === 'high' ? '🔥' : lead.priority === 'medium' ? '⚡' : 'ℹ️'} ${lead.name}*` },
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Company:*\n${lead.company ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Service:*\n${lead.service_requested ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Budget:*\n${lead.budget_range ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Timeline:*\n${lead.timeline ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Phone:*\n${lead.phone}` },
        { type: 'mrkdwn', text: `*Email:*\n${lead.email ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Priority:*\n${lead.priority.toUpperCase()}` },
        { type: 'mrkdwn', text: `*Revenue:*\n${valueStr}` },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Stage:* ${lead.pipeline_stage} | *Assigned:* ${lead.assigned_agent ?? 'Unassigned'} | *Action:* ${getActionText(lead)}` },
    },
  ]

  return post(channel, text, blocks)
}

export async function alertCallback(callback: Callback): Promise<boolean> {
  const channel = SLACK_CHANNEL_ID('sales_pipeline')
  const text = [
    `📞 *Callback Needed — ${callback.priority.toUpperCase()}*`,
    `Name: ${callback.name}`,
    `Phone: ${callback.phone}`,
    `Email: ${callback.email ?? 'N/A'}`,
    `Reason: ${callback.reason}`,
    `Department: ${callback.department}`,
    `Revenue: $${callback.revenue_potential.toLocaleString()}`,
    `Due: ${callback.due_by}`,
    `Script: ${callback.suggested_script}`,
  ].join('\n')
  return post(channel, text)
}

export async function alertPipelineUpdate(lead: Lead, previousStage: string): Promise<boolean> {
  const channel = SLACK_CHANNEL_ID('sales_pipeline')
  const text = `*Pipeline Update:* ${lead.name} moved from *${previousStage}* → *${lead.pipeline_stage}* (${lead.priority.toUpperCase()})`
  return post(channel, text)
}

export async function alertFounder(text: string): Promise<boolean> {
  return post(SLACK_CHANNEL_ID('founder'), text)
}

export async function alertSystem(text: string): Promise<boolean> {
  return post(SLACK_CHANNEL_ID('system_alerts'), `⚠️ ${text}`)
}

export async function alertRevenueDashboard(text: string): Promise<boolean> {
  return post(SLACK_CHANNEL_ID('revenue_dashboard'), text)
}

export async function postToChannel(channel: string, text: string): Promise<boolean> {
  return post(channel, text)
}

function getActionText(lead: Lead): string {
  switch (lead.pipeline_stage) {
    case 'new-inquiry': case 'captured': return 'Qualify and score priority'
    case 'qualified': case 'priority-scored': return 'Schedule discovery call'
    case 'callback-needed': return 'Call back within 24h'
    case 'discovery-scheduled': return 'Prepare proposal'
    case 'proposal-needed': return 'Send proposal'
    case 'proposal-sent': return 'Follow up in 3 days'
    case 'follow-up-due': return 'Contact now'
    case 'won': return 'Onboard client'
    default: return 'Review and update'
  }
}
