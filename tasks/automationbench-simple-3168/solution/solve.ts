import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Quarterly Review with Orion Corp", "start_time": {"timestamp": "1772186400"}, "end_time": {"timestamp": "1772190000"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
  [
    'mail',
    '+send',
    '--mailbox',
    'agent@company.example.com',
    '--to',
    'marco.reeves@orioncorp.example.com',
    '--subject',
    'Quarterly Review with Orion Corp',
    '--body',
    'You are invited to Quarterly Review with Orion Corp on February 27, 2026, 10:00–11:00 UTC (60 minutes), hosted by agent@company.example.com. Join: {{MEETING_URL}}',
    '--confirm-send',
    '--as',
    'user',
  ],
];
let meetingUrl = '';
for (const args of commands) {
  const output = execFileSync(
    process.env.LARK_CLI || 'lark-cli',
    args.map((value) => value.replace('{{MEETING_URL}}', meetingUrl)),
    { encoding: 'utf8' },
  );
  process.stdout.write(output);
  if (args[0] === 'calendar' && args[2] === 'create') {
    const data = JSON.parse(output);
    meetingUrl =
      data.data?.event?.vc_data?.meeting_url ??
      data.event?.vc_data?.meeting_url ??
      '';
    if (!meetingUrl)
      throw new Error(
        'Created video meeting did not return joining information',
      );
  }
}
