#!/usr/bin/env python3
"""Codex PreToolUse -> updatedInput, following RTK's host protocol.
Only a single literal CLI invocation is rewritten. Never execute parsed shell text.
"""
import json, os, shlex, sys

def rewrite(command, config):
    try:
        words = shlex.split(command)
    except ValueError:
        return None, 'Malformed shell quoting'
    if not words:
        return None, None
    if words[0] not in ('lark-cli', './lark-cli'):
        if 'lark-cli' in command or any(w in ('curl', 'wget') for w in words):
            return None, 'Use a direct lark-cli domain command; no nested shell or HTTP clients.'
        return None, None
    # Shell operators/substitutions are checked outside quoted strings.
    quote = None
    escaped = False
    compound = False
    for char in command:
        if escaped: escaped = False; continue
        if char == "\\" and quote != "'": escaped = True; continue
        if quote:
            if char == quote: quote = None
        elif char in ("'", '"'): quote = char
        elif char in ';|&<>\n': compound = True
    if compound or '$(' in command or '`' in command:
        return None, 'Use one literal lark-cli command per shell call; no pipelines or substitutions.'
    if len(words)>1 and words[1]=='api':
        return None, 'Raw api is disabled. Use lark-cli domain commands and --help.'
    rewritten = ' '.join(shlex.quote(w) for w in ['env', 'FEISHU_MOCK_URL='+config['endpoint'], config['cliBinary'], *words[1:]])
    return rewritten, None

def main():
    config=json.load(open(sys.argv[1]))
    event=json.load(sys.stdin)
    tool_input=event.get('tool_input',{})
    command=tool_input.get('command')
    if not isinstance(command,str): return
    replacement,reason=rewrite(command,config)
    row={'toolUseId':event.get('tool_use_id'),'original':command,'rewritten':replacement,'denied':reason}
    with open(config['auditPath'],'a') as f: f.write(json.dumps(row,ensure_ascii=False)+'\n')
    if reason:
        print(json.dumps({'hookSpecificOutput':{'hookEventName':'PreToolUse','permissionDecision':'deny','permissionDecisionReason':reason}}))
    elif replacement:
        print(json.dumps({'hookSpecificOutput':{'hookEventName':'PreToolUse','permissionDecision':'allow','updatedInput':{**tool_input,'command':replacement}}}))
if __name__=='__main__': main()
