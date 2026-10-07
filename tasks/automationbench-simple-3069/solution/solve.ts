import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+send',
    '--to',
    'fatima.alhassan@crescentlogistics.example.com',
    '--subject',
    "Welcome to BrightPath! Let's Get Started",
    '--body',
    'Welcome Fatima! Your account is active and you can log in at https://app.brightpath.example.com . Your onboarding session is scheduled for March 3 at 11 AM EST. Your dedicated success manager is Olivia Park.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
