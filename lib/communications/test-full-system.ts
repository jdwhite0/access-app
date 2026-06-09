/**
 * Communications OS — Full System Test
 *
 * Tests the complete flow from inbound call → agent processing → Slack alerts → pipeline.
 * Run: npx tsx lib/communications/test-full-system.ts
 */

import {
  processInboundEvent,
  intakeNewLead,
  qualifyLead,
  setPriority,
  handleCallbackNeeded,
  handleMediaInquiry,
  handlePartnershipInquiry,
  closeWon,
  getSalesPipeline,
  generateFounderBrief,
  processVoiceCall,
  getStatus,
  resetStore,
} from './orchestrator'

async function main() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║  COMMS OS — Full System Test           ║')
  console.log('╚════════════════════════════════════════╝\n')

  resetStore()
  let passed = 0
  let failed = 0

  function check(name: string, ok: boolean) {
    console.log(`  ${ok ? '✅' : '❌'} ${name}`)
    if (ok) passed++; else failed++
  }

  // ── 1. Inbound Call (Quo webhook style) ──
  console.log('\n── Inbound Event Processing ──')

  const callResult = await processInboundEvent({
    event_type: 'new-call',
    from_number: '+18135551234',
    to_number: '+16785551201',
    sona_summary: 'Caller said they own a restaurant in Tampa and need video production for their brand. They have a $5,000 budget and want to start within 2 weeks.',
    timestamp: new Date().toISOString(),
  })
  check('Inbound call processed', callResult.handled)
  check('Contact created', !!callResult.contact)
  check('Lead created from call', !!callResult.lead)
  // Lead priority is low initially — reception agent captures raw context;
  // structured qualification (budget/timeline/urgency) happens in lead-intake agent

  // ── 2. Second inbound call (different number, existing contact) ──
  const callResult2 = await processInboundEvent({
    event_type: 'new-call',
    from_number: '+14075559876',
    to_number: '+16785551201',
    sona_summary: 'Media inquiry — podcaster wants to interview Jerry about AI and business systems.',
    timestamp: new Date().toISOString(),
  })
  check('Media inquiry call processed', callResult2.handled)
  check('Media lead created', callResult2.lead?.source === 'media-inquiry')
  check('Media lead routed to media dept', callResult2.lead?.department === 'media')

  // ── 3. Missed call ──
  const missedResult = await processInboundEvent({
    event_type: 'missed-call',
    from_number: '+14075551234',
    to_number: '+16785551201',
    timestamp: new Date().toISOString(),
  })
  check('Missed call processed', missedResult.handled)

  // ── 4. Voicemail ──
  const vmResult = await processInboundEvent({
    event_type: 'new-voicemail',
    from_number: '+18135559876',
    to_number: '+14075551202',
    voicemail_transcript: 'Hi this is Sarah from Tampa Bakery. We need a new website and payment system for our second location opening next month. Please call me back at 813-555-9876.',
    timestamp: new Date().toISOString(),
  })
  check('Voicemail processed', vmResult.handled)
  check('Voicemail lead created', !!vmResult.lead)

  // ── 5. Manual lead intake ──
  console.log('\n── Manual Lead Intake ──')

  const { lead: manualLead } = intakeNewLead({
    name: 'Michael Thompson',
    company: 'Thompson Auto Repair',
    phone: '+18135557777',
    email: 'mike@thompsonauto.com',
    source: 'website-contact',
    service_requested: 'bridge-video',
    budget_range: '$3,000 - $5,000',
    timeline: 'Within 30 days',
    location: 'Tampa, FL',
    decision_maker_status: 'yes',
  })
  check('Manual lead intake', manualLead.pipeline_stage === 'new-inquiry')

  const qualified = qualifyLead(manualLead.id, { business_type: 'auto-repair', urgency: 'soon' })
  check('Lead qualified', qualified?.pipeline_stage === 'qualified')

  const scored = setPriority(manualLead.id)
  check('Lead priority scored', scored?.pipeline_stage === 'priority-scored')
  check('Correct priority', scored?.priority === 'high')

  // ── 6. Callback generation ──
  console.log('\n── Callback Engine ──')

  const callback = handleCallbackNeeded(scored!.id)
  check('Callback created', !!callback)
  check('Callback has script', (callback?.suggested_script?.length ?? 0) > 20)
  check('Callback has revenue potential', (callback?.revenue_potential ?? 0) > 0)

  check('Due callbacks pending', callback?.status === 'pending')

  // ── 7. Media inquiry ──
  console.log('\n── Media & Partnerships ──')

  const mediaLead = handleMediaInquiry({
    name: 'Alex Rivera',
    company: 'Tech Today Podcast',
    phone: '+13105551111',
    email: 'alex@techtoday.com',
    outlet: 'Tech Today',
    type: 'podcast',
    topic: 'AI in business operations',
  })
  check('Media inquiry handled', mediaLead.department === 'media')

  const partnerLead = handlePartnershipInquiry({
    name: 'Jennifer Walsh',
    company: 'Walsh Consulting Group',
    phone: '+14075552222',
    email: 'jennifer@walshconsulting.com',
    type: 'partner',
    description: 'Business consulting partnership for client referrals',
  })
  check('Partnership inquiry handled', partnerLead.department === 'partnerships')

  // ── 8. Pipeline advancement ──
  console.log('\n── Sales Pipeline ──')

  const won = closeWon(manualLead.id, 5000)
  check('Lead closed won', won?.pipeline_stage === 'won')
  check('Revenue tracked', won?.estimated_value === 5000)

  const pipeline = getSalesPipeline()
  check('Pipeline report generated', pipeline.length > 0)
  const totalPipelineValue = pipeline.reduce((s, p) => s + p.value, 0)
  check('Pipeline has value', totalPipelineValue > 0)

  // ── 9. Voice call processing ──
  console.log('\n── AI Voice Call Processing ──')

  const voiceResult = await processVoiceCall({
    fromNumber: '+18135556666',
    toNumber: '+16785551201',
    transcript: 'Hi my name is David Chen. I own three restaurants in Orlando and I need a complete video package for my new flagship location. My budget is around $8,000 and I want to launch in 3 weeks.',
    durationSeconds: 145,
  })
  check('Voice call processed', voiceResult.success)
  check('Voice call has summary', !!voiceResult.summary)

  // ── 10. Founder Brief ──
  console.log('\n── Founder Briefing ──')

  const brief = generateFounderBrief()
  check('Brief generated', brief.date.length > 0)
  check('Top actions identified', brief.topActions.length > 0)
  check('Pipeline value tracked', brief.pipelineValue.total > 0)

  const status = getStatus()
  console.log(`\n── Final Status ──`)
  console.log(`  Contacts:     ${status.contacts}`)
  console.log(`  Leads:        ${status.leads}`)
  console.log(`  Interactions: ${status.interactions}`)
  console.log(`  Callbacks:    ${status.callbacks}`)
  console.log(`  Pipeline:     $${status.pipelineValue.toLocaleString()}`)
  console.log(`  Closed:       $${status.closedRevenue.toLocaleString()}`)
  console.log(`  Hot leads:    ${status.hotLeads}`)

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`${'═'.repeat(50)}\n`)

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
